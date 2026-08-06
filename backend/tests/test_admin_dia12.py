import unittest
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.core.security import create_access_token
from app.db.session import Base, get_db
from app.main import app
from app.models.categoria_tecnologia import CategoriaTecnologia
from app.models.modulo import Modulo
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.perfil_usuario import PerfilUsuario
from app.models.progreso import Progreso
from app.models.ruta_aprendizaje import RutaAprendizaje
from app.models.usuario import Usuario


class AdminDia12Tests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite+pysqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.admin = self._crear_usuario(
            "Admin Principal",
            "admin@example.com",
            rol="admin",
        )
        self.estudiante = self._crear_usuario(
            "Bruno Estudiante",
            "bruno@example.com",
        )
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

    def _crear_detalle_estudiante(self):
        categoria = CategoriaTecnologia(
            nombre="Backend",
            descripcion="Tecnologías de servidor",
        )
        self.db.add(categoria)
        self.db.flush()
        perfil = PerfilUsuario(
            usuario_id=self.estudiante.id,
            meta_profesional="Backend Developer",
            nivel_actual="junior",
        )
        self.db.add(perfil)
        self.db.flush()
        tecnologia = PerfilTecnologia(
            perfil_id=perfil.id,
            categoria_id=categoria.id,
        )
        self.db.add(tecnologia)

        ruta = RutaAprendizaje(
            usuario_id=self.estudiante.id,
            titulo="Ruta Backend Developer",
            estado="activa",
        )
        self.db.add(ruta)
        self.db.flush()
        modulos = [
            Modulo(
                ruta_id=ruta.id,
                titulo=f"Módulo {orden}",
                nivel="junior",
                tiempo_estimado_hrs=orden * 2,
                orden=orden,
            )
            for orden in (2, 1)
        ]
        self.db.add_all(modulos)
        self.db.flush()
        modulo_uno = next(modulo for modulo in modulos if modulo.orden == 1)
        self.db.add(
            Progreso(
                usuario_id=self.estudiante.id,
                modulo_id=modulo_uno.id,
                estado="completado",
            )
        )
        self.db.commit()
        return perfil, tecnologia, ruta

    def test_usuario_no_autenticado_recibe_401(self):
        response = self.client.get("/api/v1/admin/usuarios")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.headers["www-authenticate"], "Bearer")

    def test_usuario_no_admin_recibe_403(self):
        response = self.client.get(
            "/api/v1/admin/usuarios",
            headers=self.estudiante_headers,
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_lista_usuarios_sin_datos_sensibles(self):
        self._crear_detalle_estudiante()

        response = self.client.get(
            "/api/v1/admin/usuarios",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 2)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["pages"], 1)
        estudiante = next(
            usuario
            for usuario in data["usuarios"]
            if usuario["id"] == str(self.estudiante.id)
        )
        self.assertTrue(estudiante["tiene_perfil"])
        self.assertTrue(estudiante["tiene_ruta_activa"])
        self.assertNotIn("password", response.text.lower())

    def test_paginacion_y_limites(self):
        self._crear_usuario("Ana", "ana@example.com")
        self._crear_usuario("Carlos", "carlos@example.com")
        self.db.commit()

        response = self.client.get(
            "/api/v1/admin/usuarios?page=2&limit=2",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 4)
        self.assertEqual(response.json()["pages"], 2)
        self.assertEqual(len(response.json()["usuarios"]), 2)
        self.assertEqual(
            self.client.get(
                "/api/v1/admin/usuarios?page=0",
                headers=self.admin_headers,
            ).status_code,
            422,
        )
        self.assertEqual(
            self.client.get(
                "/api/v1/admin/usuarios?limit=101",
                headers=self.admin_headers,
            ).status_code,
            422,
        )

    def test_busqueda_por_nombre_y_email(self):
        por_nombre = self.client.get(
            "/api/v1/admin/usuarios?search=Bruno",
            headers=self.admin_headers,
        )
        por_email = self.client.get(
            "/api/v1/admin/usuarios?search=bruno%40example.com",
            headers=self.admin_headers,
        )

        self.assertEqual(por_nombre.status_code, 200)
        self.assertEqual(por_nombre.json()["total"], 1)
        self.assertEqual(por_email.status_code, 200)
        self.assertEqual(por_email.json()["total"], 1)

    def test_admin_obtiene_detalle_y_progreso(self):
        perfil, tecnologia, ruta = self._crear_detalle_estudiante()

        response = self.client.get(
            f"/api/v1/admin/usuarios/{self.estudiante.id}",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["perfil"]["id"], str(perfil.id))
        self.assertEqual(data["tecnologias"][0]["id"], str(tecnologia.id))
        self.assertEqual(data["tecnologias"][0]["nombre"], "Backend")
        self.assertEqual(data["ruta_activa"]["id"], str(ruta.id))
        self.assertEqual(
            [modulo["orden"] for modulo in data["ruta_activa"]["modulos"]],
            [1, 2],
        )
        self.assertEqual(data["progreso"]["modulos_completados"], 1)
        self.assertEqual(data["progreso"]["modulos_pendientes"], 1)
        self.assertEqual(data["progreso"]["porcentaje"], 50.0)
        self.assertNotIn("password", response.text.lower())
        self.assertNotIn("hash-super-secreto", response.text)

    def test_usuario_sin_perfil_ni_ruta_devuelve_vacios(self):
        response = self.client.get(
            f"/api/v1/admin/usuarios/{self.admin.id}",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["perfil"])
        self.assertEqual(response.json()["tecnologias"], [])
        self.assertIsNone(response.json()["ruta_activa"])
        self.assertIsNone(response.json()["progreso"])

    def test_usuario_inexistente_devuelve_404(self):
        response = self.client.get(
            f"/api/v1/admin/usuarios/{uuid4()}",
            headers=self.admin_headers,
        )

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
