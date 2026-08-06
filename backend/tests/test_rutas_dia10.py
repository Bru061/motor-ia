import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import joinedload, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.api.v1.endpoints.rutas import (
    _crear_ruta_para_usuario,
    _generar_ruta_usuario,
    _guardar_ruta_generada,
    _obtener_perfil_usuario,
)
from app.db.session import Base
from app.main import app
from app.models.categoria_tecnologia import CategoriaTecnologia
from app.models.modulo import Modulo
from app.models.perfil_tecnologia import PerfilTecnologia
from app.models.perfil_usuario import PerfilUsuario
from app.models.ruta_aprendizaje import RutaAprendizaje
from app.models.usuario import Usuario
from app.schemas.ruta_ia import RutaIAResponse


def _ruta_ia(
    titulo: str = "Ruta Backend",
    cantidad_modulos: int = 6,
) -> RutaIAResponse:
    return RutaIAResponse.model_validate(
        {
            "titulo": titulo,
            "modulos": [
                {
                    "clave": f"modulo_{orden}",
                    "titulo": f"Modulo {orden}",
                    "nivel": "junior",
                    "orden": orden,
                    "tiempo_estimado_hrs": orden * 2,
                    "recursos": [
                        {
                            "titulo": f"Recurso {orden}",
                            "tipo": "documentacion",
                            "url": f"https://example.com/{orden}",
                        }
                    ],
                    "dependencias": ([] if orden == 1 else [f"modulo_{orden - 1}"]),
                    "actividad_practica": f"Practica del modulo {orden}",
                }
                for orden in range(1, cantidad_modulos + 1)
            ],
        }
    )


class RutasDia10Tests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite+pysqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
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

    def _crear_perfil(
        self,
        usuario: Usuario,
        categoria: CategoriaTecnologia,
        meta: str,
    ) -> PerfilUsuario:
        perfil = PerfilUsuario(
            usuario_id=usuario.id,
            meta_profesional=meta,
            nivel_actual="junior",
        )
        self.db.add(perfil)
        self.db.flush()
        self.db.add(
            PerfilTecnologia(
                perfil_id=perfil.id,
                categoria_id=categoria.id,
            )
        )
        self.db.flush()
        return perfil

    def test_cache_clona_ruta_recursos_y_dependencias_con_ids_nuevos(self):
        categoria = CategoriaTecnologia(nombre="Backend")
        self.db.add(categoria)
        self.db.flush()

        usuario_origen = self._crear_usuario("origen@example.com")
        usuario_destino = self._crear_usuario("destino@example.com")
        perfil_origen = self._crear_perfil(
            usuario_origen,
            categoria,
            "  Backend   Developer ",
        )
        self._crear_perfil(
            usuario_destino,
            categoria,
            "backend developer",
        )
        ruta_origen = _guardar_ruta_generada(
            self.db,
            perfil_origen,
            _ruta_ia(),
        )
        self.db.commit()
        ruta_origen_id = ruta_origen.id

        perfil_destino = _obtener_perfil_usuario(self.db, usuario_destino.id)
        with patch(
            "app.api.v1.endpoints.rutas.generar_ruta_con_gemini"
        ) as generar_gemini:
            ruta_clonada = _crear_ruta_para_usuario(self.db, perfil_destino)
            self.db.commit()

        generar_gemini.assert_not_called()
        self.assertNotEqual(ruta_clonada.id, ruta_origen_id)
        self.assertEqual(ruta_clonada.usuario_id, usuario_destino.id)
        self.assertTrue(ruta_clonada.desde_cache)

        rutas = (
            self.db.query(RutaAprendizaje)
            .options(
                joinedload(RutaAprendizaje.modulos).joinedload(Modulo.recursos),
                joinedload(RutaAprendizaje.modulos).joinedload(Modulo.dependencias),
            )
            .filter(RutaAprendizaje.id.in_([ruta_origen_id, ruta_clonada.id]))
            .all()
        )
        origen = next(ruta for ruta in rutas if ruta.id == ruta_origen_id)
        clon = next(ruta for ruta in rutas if ruta.id == ruta_clonada.id)

        ids_modulos_origen = {modulo.id for modulo in origen.modulos}
        ids_modulos_clon = {modulo.id for modulo in clon.modulos}
        ids_recursos_origen = {
            recurso.id for modulo in origen.modulos for recurso in modulo.recursos
        }
        ids_recursos_clon = {
            recurso.id for modulo in clon.modulos for recurso in modulo.recursos
        }
        self.assertTrue(ids_modulos_origen.isdisjoint(ids_modulos_clon))
        self.assertTrue(ids_recursos_origen.isdisjoint(ids_recursos_clon))

        modulos_clon_por_orden = {modulo.orden: modulo for modulo in clon.modulos}
        dependencia_modulo_dos = modulos_clon_por_orden[2].dependencias[0]
        self.assertEqual(
            dependencia_modulo_dos.depende_de_id,
            modulos_clon_por_orden[1].id,
        )

    def test_cache_ignora_ruta_antigua_con_menos_modulos_del_minimo(self):
        categoria = CategoriaTecnologia(nombre="Backend")
        self.db.add(categoria)
        self.db.flush()

        usuario_origen = self._crear_usuario("origen-corto@example.com")
        usuario_destino = self._crear_usuario("destino-completo@example.com")
        perfil_origen = self._crear_perfil(
            usuario_origen, categoria, "Backend Developer"
        )
        self._crear_perfil(usuario_destino, categoria, "Backend Developer")
        _guardar_ruta_generada(
            self.db,
            perfil_origen,
            _ruta_ia("Ruta corta anterior", cantidad_modulos=3),
        )
        self.db.commit()

        perfil_destino = _obtener_perfil_usuario(self.db, usuario_destino.id)
        with patch(
            "app.api.v1.endpoints.rutas.generar_ruta_con_gemini",
            return_value=_ruta_ia("Ruta completa nueva"),
        ) as generar_gemini:
            ruta_nueva = _crear_ruta_para_usuario(self.db, perfil_destino)

        generar_gemini.assert_called_once_with(perfil_destino)
        self.assertFalse(ruta_nueva.desde_cache)
        self.assertEqual(len(ruta_nueva.modulos), 6)

    def test_regenerar_archiva_la_ruta_activa_y_crea_otra(self):
        categoria = CategoriaTecnologia(nombre="Backend")
        self.db.add(categoria)
        self.db.flush()
        usuario = self._crear_usuario("usuario@example.com")
        perfil = self._crear_perfil(usuario, categoria, "Backend Developer")
        ruta_anterior = _guardar_ruta_generada(
            self.db,
            perfil,
            _ruta_ia("Ruta anterior"),
        )
        self.db.commit()
        ruta_anterior_id = ruta_anterior.id

        with patch(
            "app.api.v1.endpoints.rutas.generar_ruta_con_gemini",
            return_value=_ruta_ia("Ruta nueva"),
        ) as generar_gemini:
            ruta_nueva = _generar_ruta_usuario(
                self.db,
                usuario.id,
                archivar_rutas_activas=True,
            )

        generar_gemini.assert_called_once()
        ruta_anterior = self.db.get(RutaAprendizaje, ruta_anterior_id)
        self.assertEqual(ruta_anterior.estado, "archivada")
        self.assertEqual(ruta_nueva.estado, "activa")
        self.assertFalse(ruta_nueva.desde_cache)

    def test_regenerar_sin_perfil_responde_404(self):
        usuario = self._crear_usuario("sin-perfil@example.com")
        self.db.commit()

        with self.assertRaises(HTTPException) as contexto:
            _generar_ruta_usuario(
                self.db,
                usuario.id,
                archivar_rutas_activas=True,
            )

        self.assertEqual(contexto.exception.status_code, 404)

    def test_openapi_expone_ambos_endpoints_con_jwt(self):
        schema = app.openapi()
        rutas = schema["paths"]

        self.assertIn("/api/v1/rutas/generar", rutas)
        self.assertIn("/api/v1/rutas/regenerar", rutas)
        self.assertEqual(
            rutas["/api/v1/rutas/regenerar"]["post"]["security"],
            [{"HTTPBearer": []}],
        )


if __name__ == "__main__":
    unittest.main()
