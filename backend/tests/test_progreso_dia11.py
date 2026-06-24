import unittest
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401: registra todos los modelos en metadata
from app.core.dependencies import get_current_user
from app.db.session import Base, get_db
from app.main import app
from app.models.dependencia_modulo import DependenciaModulo
from app.models.modulo import Modulo
from app.models.progreso import Progreso
from app.models.recurso import Recurso
from app.models.recurso_progreso import RecursoProgreso
from app.models.ruta_aprendizaje import RutaAprendizaje
from app.models.usuario import Usuario


class ProgresoDia11Tests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite+pysqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.usuario = self._crear_usuario("estudiante@example.com")
        self.db.commit()

        def override_db():
            yield self.db

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user] = lambda: self.usuario
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.db.close()
        self.engine.dispose()

    def _crear_usuario(self, email: str) -> Usuario:
        usuario = Usuario(
            id=uuid4(),
            nombre="Usuario",
            email=email,
            password_hash="hash",
        )
        self.db.add(usuario)
        self.db.flush()
        return usuario

    def _crear_ruta(
        self,
        usuario: Usuario,
        estado: str = "activa",
        cantidad_modulos: int = 2,
        recursos_por_modulo: int = 2,
    ) -> tuple[RutaAprendizaje, list[Modulo], list[Recurso]]:
        ruta = RutaAprendizaje(
            usuario_id=usuario.id,
            titulo="Ruta Backend",
            estado=estado,
            desde_cache=False,
        )
        self.db.add(ruta)
        self.db.flush()

        modulos = []
        recursos = []
        for orden in range(1, cantidad_modulos + 1):
            modulo = Modulo(
                ruta_id=ruta.id,
                titulo=f"Módulo {orden}",
                nivel="junior",
                tiempo_estimado_hrs=orden * 2,
                orden=orden,
            )
            self.db.add(modulo)
            self.db.flush()
            modulos.append(modulo)

            for indice in range(1, recursos_por_modulo + 1):
                recurso = Recurso(
                    modulo_id=modulo.id,
                    titulo=f"Recurso {orden}.{indice}",
                    tipo="documentacion",
                    url=f"https://example.com/{orden}/{indice}",
                )
                self.db.add(recurso)
                recursos.append(recurso)

        if len(modulos) >= 2:
            self.db.add(
                DependenciaModulo(
                    modulo_id=modulos[1].id,
                    depende_de_id=modulos[0].id,
                )
            )

        self.db.commit()
        return ruta, modulos, recursos

    def test_consultar_ruta_activa_incluye_progreso_y_pendientes(self):
        ruta, modulos, recursos = self._crear_ruta(self.usuario)
        self.db.add(
            Progreso(
                usuario_id=self.usuario.id,
                modulo_id=modulos[0].id,
                estado="en_progreso",
            )
        )
        self.db.add(
            RecursoProgreso(
                usuario_id=self.usuario.id,
                recurso_id=recursos[0].id,
                estado="completado",
                visto=True,
            )
        )
        self.db.commit()

        response = self.client.get("/api/v1/progreso/ruta-activa")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], str(ruta.id))
        self.assertEqual(data["modulos"][0]["estado"], "en_progreso")
        self.assertEqual(
            data["modulos"][0]["recursos"][0]["estado"],
            "completado",
        )
        self.assertEqual(data["modulos"][1]["estado"], "pendiente")
        self.assertEqual(
            data["modulos"][1]["recursos"][0]["estado"],
            "pendiente",
        )
        self.assertEqual(
            data["modulos"][1]["dependencias"][0]["depende_de_id"],
            str(modulos[0].id),
        )

    def test_actualizar_progreso_modulo_crea_y_luego_actualiza(self):
        _, modulos, _ = self._crear_ruta(self.usuario)
        url = f"/api/v1/progreso/modulos/{modulos[0].id}"

        response = self.client.patch(url, json={"estado": "en_progreso"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estado"], "en_progreso")

        response = self.client.patch(url, json={"estado": "completado"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estado"], "completado")
        self.assertIsNotNone(response.json()["completado_at"])

        response = self.client.patch(url, json={"estado": "pendiente"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estado"], "pendiente")
        self.assertIsNone(response.json()["completado_at"])
        self.assertEqual(
            self.db.query(Progreso)
            .filter(Progreso.modulo_id == modulos[0].id)
            .count(),
            1,
        )

    def test_actualizar_progreso_recurso_crea_y_luego_actualiza(self):
        _, _, recursos = self._crear_ruta(self.usuario)
        url = f"/api/v1/progreso/recursos/{recursos[0].id}"

        response = self.client.patch(url, json={"estado": "en_progreso"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estado"], "en_progreso")

        response = self.client.patch(url, json={"estado": "completado"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estado"], "completado")
        progreso = self.db.query(RecursoProgreso).one()
        self.assertTrue(progreso.visto)
        self.assertEqual(
            self.db.query(RecursoProgreso)
            .filter(RecursoProgreso.recurso_id == recursos[0].id)
            .count(),
            1,
        )

    def test_calcular_resumen_de_progreso(self):
        _, modulos, recursos = self._crear_ruta(
            self.usuario,
            cantidad_modulos=3,
        )
        self.db.add_all(
            [
                Progreso(
                    usuario_id=self.usuario.id,
                    modulo_id=modulos[0].id,
                    estado="completado",
                ),
                Progreso(
                    usuario_id=self.usuario.id,
                    modulo_id=modulos[1].id,
                    estado="en_progreso",
                ),
                RecursoProgreso(
                    usuario_id=self.usuario.id,
                    recurso_id=recursos[0].id,
                    estado="completado",
                    visto=True,
                ),
            ]
        )
        self.db.commit()

        response = self.client.get("/api/v1/progreso/resumen")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "total_modulos": 3,
                "modulos_completados": 1,
                "modulos_pendientes": 1,
                "modulos_en_progreso": 1,
                "porcentaje_avance": 33.33,
                "total_recursos": 6,
                "recursos_completados": 1,
                "porcentaje_modulos": 33.33,
                "porcentaje_recursos": 16.67,
                "porcentaje_general": 22.22,
            },
        )

    def test_resumen_de_ruta_sin_modulos_devuelve_ceros(self):
        self._crear_ruta(
            self.usuario,
            cantidad_modulos=0,
            recursos_por_modulo=0,
        )

        response = self.client.get("/api/v1/progreso/resumen")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total_modulos"], 0)
        self.assertEqual(response.json()["modulos_pendientes"], 0)
        self.assertEqual(response.json()["porcentaje_avance"], 0.0)

    def test_rechazar_modulo_que_pertenece_a_otro_usuario(self):
        otro_usuario = self._crear_usuario("otro@example.com")
        _, modulos, _ = self._crear_ruta(otro_usuario)

        response = self.client.patch(
            f"/api/v1/progreso/modulos/{modulos[0].id}",
            json={"estado": "completado"},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.db.query(Progreso).count(), 0)

    def test_rechazar_recurso_que_pertenece_a_otro_usuario(self):
        otro_usuario = self._crear_usuario("otro@example.com")
        _, _, recursos = self._crear_ruta(otro_usuario)

        response = self.client.patch(
            f"/api/v1/progreso/recursos/{recursos[0].id}",
            json={"estado": "completado"},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.db.query(RecursoProgreso).count(), 0)

    def test_rechazar_modulo_y_recurso_de_ruta_archivada(self):
        _, modulos, recursos = self._crear_ruta(
            self.usuario,
            estado="archivada",
        )

        modulo_response = self.client.patch(
            f"/api/v1/progreso/modulos/{modulos[0].id}",
            json={"estado": "completado"},
        )
        recurso_response = self.client.patch(
            f"/api/v1/progreso/recursos/{recursos[0].id}",
            json={"estado": "completado"},
        )

        self.assertEqual(modulo_response.status_code, 404)
        self.assertEqual(recurso_response.status_code, 404)

    def test_rechazar_estado_no_permitido(self):
        _, modulos, recursos = self._crear_ruta(self.usuario)

        modulo_response = self.client.patch(
            f"/api/v1/progreso/modulos/{modulos[0].id}",
            json={"estado": "cancelado"},
        )
        recurso_response = self.client.patch(
            f"/api/v1/progreso/recursos/{recursos[0].id}",
            json={"estado": "cancelado"},
        )

        self.assertEqual(modulo_response.status_code, 422)
        self.assertEqual(recurso_response.status_code, 422)

    def test_ruta_activa_y_resumen_responden_404_si_no_existe(self):
        self._crear_ruta(self.usuario, estado="archivada")

        ruta_response = self.client.get("/api/v1/progreso/ruta-activa")
        resumen_response = self.client.get("/api/v1/progreso/resumen")

        self.assertEqual(ruta_response.status_code, 404)
        self.assertEqual(resumen_response.status_code, 404)

    def test_openapi_expone_endpoints_de_progreso_con_jwt(self):
        schema = app.openapi()
        paths = schema["paths"]

        self.assertIn("/api/v1/progreso/ruta-activa", paths)
        self.assertIn("/api/v1/progreso/resumen", paths)
        self.assertEqual(
            paths["/api/v1/progreso/ruta-activa"]["get"]["security"],
            [{"HTTPBearer": []}],
        )

if __name__ == "__main__":
    unittest.main()
