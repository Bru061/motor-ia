import unittest
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401: registra todos los modelos en metadata
from app.core.security import create_access_token
from app.db.session import Base, get_db
from app.main import app
from app.models.categoria_tecnologia import CategoriaTecnologia
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.perfil_usuario import PerfilUsuario
from app.models.usuario import Usuario
from app.services.analitica_service import clasificar_meta_profesional


class AnaliticaDia13Tests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite+pysqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)
        self.db = self.Session()

        self.admin = self._crear_usuario(
            "Admin Principal",
            "admin@example.com",
            rol="admin",
        )
        self.estudiante = self._crear_usuario(
            "Estudiante",
            "estudiante@example.com",
        )
        self.categorias = {
            nombre: CategoriaTecnologia(
                nombre=nombre,
                descripcion=f"Descripcion de {nombre}",
            )
            for nombre in (
                "Frontend",
                "Backend",
                "Base de datos",
                "DevOps",
                "Data Science",
                "Mobile",
                "Seguridad",
                "Control de versiones",
            )
        }
        self.db.add_all(self.categorias.values())
        self.db.commit()

        def override_db():
            yield self.db

        app.dependency_overrides[get_db] = override_db
        self.client = TestClient(app)
        self.admin_headers = self._headers(self.admin)
        self.estudiante_headers = self._headers(self.estudiante)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.db.close()
        self.engine.dispose()

    def _crear_usuario(
        self,
        nombre: str,
        email: str,
        rol: str = "estudiante",
    ) -> Usuario:
        usuario = Usuario(
            id=uuid4(),
            nombre=nombre,
            email=email,
            password_hash="hash-super-secreto",
            rol=rol,
        )
        self.db.add(usuario)
        self.db.flush()
        return usuario

    @staticmethod
    def _headers(usuario: Usuario) -> dict[str, str]:
        token = create_access_token(
            {
                "usuario_id": str(usuario.id),
                "email": usuario.email,
                "rol": usuario.rol,
            }
        )
        return {"Authorization": f"Bearer {token}"}

    def _crear_perfil(
        self,
        usuario: Usuario,
        meta: str,
        tecnologias: tuple[str, ...] = (),
    ) -> PerfilUsuario:
        perfil = PerfilUsuario(
            usuario_id=usuario.id,
            meta_profesional=meta,
            nivel_actual="junior",
        )
        self.db.add(perfil)
        self.db.flush()
        self.db.add_all(
            [
                PerfilTecnologia(
                    perfil_id=perfil.id,
                    categoria_id=self.categorias[nombre].id,
                )
                for nombre in tecnologias
            ]
        )
        self.db.flush()
        return perfil

    def test_ambos_endpoints_requieren_admin(self):
        endpoints = (
            "/api/v1/admin/analitica/tecnologias-demandadas",
            "/api/v1/admin/analitica/skill-gap",
        )

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint, caso="sin_token"):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 401)
                self.assertEqual(
                    response.headers["www-authenticate"],
                    "Bearer",
                )

            with self.subTest(endpoint=endpoint, caso="no_admin"):
                response = self.client.get(
                    endpoint,
                    headers=self.estudiante_headers,
                )
                self.assertEqual(response.status_code, 403)

            with self.subTest(endpoint=endpoint, caso="token_invalido"):
                response = self.client.get(
                    endpoint,
                    headers={"Authorization": "Bearer token-invalido"},
                )
                self.assertEqual(response.status_code, 401)

    def test_sin_perfiles_devuelve_listas_vacias(self):
        demanda = self.client.get(
            "/api/v1/admin/analitica/tecnologias-demandadas",
            headers=self.admin_headers,
        )
        skill_gap = self.client.get(
            "/api/v1/admin/analitica/skill-gap",
            headers=self.admin_headers,
        )

        self.assertEqual(demanda.status_code, 200)
        self.assertEqual(
            demanda.json(),
            {"total_perfiles_analizados": 0, "tecnologias": []},
        )
        self.assertEqual(skill_gap.status_code, 200)
        self.assertEqual(
            skill_gap.json(),
            {
                "total_perfiles_analizados": 0,
                "total_perfiles_sin_clasificar": 0,
                "brechas": [],
            },
        )

    def test_perfil_sin_tecnologias_devuelve_demanda_vacia(self):
        self._crear_perfil(self.estudiante, "Backend Developer")
        self.db.commit()

        response = self.client.get(
            "/api/v1/admin/analitica/tecnologias-demandadas",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"total_perfiles_analizados": 1, "tecnologias": []},
        )

    def test_clasificacion_normaliza_acentos_y_respeta_palabras_completas(self):
        self.assertEqual(
            clasificar_meta_profesional("An\u00e1lisis de datos"),
            "data",
        )
        self.assertEqual(
            clasificar_meta_profesional("Desarrollo de aplicaciones moviles"),
            "mobile",
        )
        self.assertEqual(
            clasificar_meta_profesional("Curiosidad por producto digital"),
            "sin_clasificar",
        )

    def test_tecnologias_demandadas_cuenta_ordena_y_calcula_porcentaje(self):
        usuario_dos = self._crear_usuario("Usuario 2", "usuario2@example.com")
        usuario_tres = self._crear_usuario("Usuario 3", "usuario3@example.com")
        perfil_uno = self._crear_perfil(
            self.estudiante,
            "Backend Developer",
            ("Backend", "Base de datos"),
        )
        self._crear_perfil(
            usuario_dos,
            "Backend Developer",
            ("Backend",),
        )
        self._crear_perfil(usuario_tres, "Product Manager")

        # Una asociacion duplicada no debe inflar el total de perfiles.
        self.db.add(
            PerfilTecnologia(
                perfil_id=perfil_uno.id,
                categoria_id=self.categorias["Backend"].id,
            )
        )
        self.db.commit()

        response = self.client.get(
            "/api/v1/admin/analitica/tecnologias-demandadas",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_perfiles_analizados"], 3)
        self.assertEqual(
            [item["nombre"] for item in data["tecnologias"]],
            ["Backend", "Base de datos"],
        )
        self.assertEqual(data["tecnologias"][0]["total_usuarios"], 2)
        self.assertEqual(data["tecnologias"][0]["porcentaje"], 66.67)
        self.assertEqual(data["tecnologias"][1]["total_usuarios"], 1)
        self.assertEqual(data["tecnologias"][1]["porcentaje"], 33.33)
        self.assertNotIn("email", response.text.lower())
        self.assertNotIn("password", response.text.lower())

    def test_skill_gap_agrega_brechas_y_cuenta_sin_clasificar(self):
        usuario_dos = self._crear_usuario("Usuario 2", "usuario2@example.com")
        usuario_tres = self._crear_usuario("Usuario 3", "usuario3@example.com")
        usuario_cuatro = self._crear_usuario(
            "Usuario 4",
            "usuario4@example.com",
        )
        usuario_cinco = self._crear_usuario(
            "Usuario 5",
            "usuario5@example.com",
        )
        self._crear_perfil(
            self.estudiante,
            "Backend Developer",
            ("Backend",),
        )
        self._crear_perfil(
            usuario_dos,
            "Ingeniera backend",
            ("Backend", "Base de datos"),
        )
        self._crear_perfil(
            usuario_tres,
            "Frontend Developer",
            ("Frontend", "Control de versiones"),
        )
        self._crear_perfil(usuario_cuatro, "Product Manager")
        self._crear_perfil(usuario_cinco, "   ")
        self.db.commit()

        response = self.client.get(
            "/api/v1/admin/analitica/skill-gap",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_perfiles_analizados"], 4)
        self.assertEqual(data["total_perfiles_sin_clasificar"], 1)
        self.assertEqual(
            data["brechas"],
            [
                {
                    "tecnologia": "Control de versiones",
                    "usuarios_con_brecha": 2,
                    "porcentaje": 50.0,
                },
                {
                    "tecnologia": "DevOps",
                    "usuarios_con_brecha": 2,
                    "porcentaje": 50.0,
                },
                {
                    "tecnologia": "Base de datos",
                    "usuarios_con_brecha": 1,
                    "porcentaje": 25.0,
                },
            ],
        )
        self.assertNotIn("email", response.text.lower())
        self.assertNotIn("password", response.text.lower())

    def test_openapi_expone_analitica_con_jwt(self):
        schema = app.openapi()
        paths = schema["paths"]
        endpoints = (
            "/api/v1/admin/analitica/tecnologias-demandadas",
            "/api/v1/admin/analitica/skill-gap",
        )

        for endpoint in endpoints:
            self.assertIn(endpoint, paths)
            self.assertEqual(
                paths[endpoint]["get"]["security"],
                [{"HTTPBearer": []}],
            )


if __name__ == "__main__":
    unittest.main()
