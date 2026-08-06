import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from pydantic import ValidationError

from app.schemas.ruta_ia import RutaIAResponse
from app.services.gemini_service import (
    GeminiServiceError,
    MAX_INTENTOS_GENERACION,
    construir_prompt,
    generar_ruta_con_gemini,
    obtener_limites_modulos,
)


def _respuesta_valida(cantidad_modulos: int = 6) -> dict:
    return {
        "titulo": "Ruta Backend",
        "modulos": [
            {
                "clave": f"modulo_{orden}",
                "titulo": f"Modulo {orden}",
                "nivel": "junior",
                "orden": orden,
                "tiempo_estimado_hrs": 4,
                "recursos": [
                    {
                        "titulo": f"Recurso {orden}",
                        "tipo": "documentacion",
                        "url": f"https://example.com/{orden}",
                    }
                ],
                "dependencias": [] if orden == 1 else [f"modulo_{orden - 1}"],
                "actividad_practica": f"Practica del modulo {orden}",
            }
            for orden in range(1, cantidad_modulos + 1)
        ],
    }


def _tecnologia(nombre: str) -> SimpleNamespace:
    return SimpleNamespace(categoria=SimpleNamespace(nombre=nombre))


class _ModelosGeminiFalsos:
    def __init__(self, textos: list[str]):
        self._textos = iter(textos)
        self.llamadas = 0

    def generate_content(self, **_kwargs):
        self.llamadas += 1
        return SimpleNamespace(text=next(self._textos))


class GeminiServiceTests(unittest.TestCase):
    def setUp(self):
        self.perfil = SimpleNamespace(
            meta_profesional="Backend Developer",
            nivel_actual="junior",
            tecnologias=[],
        )

    def test_define_limites_segun_cantidad_de_categorias(self):
        self.assertEqual(obtener_limites_modulos(1), (6, 8))
        self.assertEqual(obtener_limites_modulos(2), (10, 12))
        self.assertEqual(obtener_limites_modulos(3), (12, 15))
        self.assertEqual(obtener_limites_modulos(5), (12, 15))

    def test_prompt_exige_rango_y_cobertura_equilibrada(self):
        self.perfil.tecnologias = [
            _tecnologia("Backend"),
            _tecnologia("Base de datos"),
        ]

        prompt = construir_prompt(self.perfil)

        self.assertIn("entre 10 y 12 modulos", prompt)
        self.assertIn("Backend, Base de datos", prompt)
        self.assertIn("forma equilibrada", prompt)
        self.assertIn("proyecto aplicado final", prompt)

    def test_reintenta_si_el_primer_json_es_invalido(self):
        respuesta_valida = json.dumps(_respuesta_valida())
        modelos = _ModelosGeminiFalsos(["JSON invalido", respuesta_valida])
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            resultado = generar_ruta_con_gemini(self.perfil)

        self.assertEqual(resultado.titulo, "Ruta Backend")
        self.assertEqual(modelos.llamadas, 2)

    def test_rechaza_markdown_y_reintenta(self):
        respuesta_valida = json.dumps(_respuesta_valida())
        modelos = _ModelosGeminiFalsos(
            [f"```json\n{respuesta_valida}\n```", respuesta_valida]
        )
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            resultado = generar_ruta_con_gemini(self.perfil)

        self.assertEqual(resultado.titulo, "Ruta Backend")
        self.assertEqual(modelos.llamadas, 2)

    def test_reintenta_si_la_ruta_tiene_menos_modulos_del_minimo(self):
        respuesta_corta = json.dumps(_respuesta_valida(3))
        respuesta_valida = json.dumps(_respuesta_valida(6))
        modelos = _ModelosGeminiFalsos([respuesta_corta, respuesta_valida])
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            resultado = generar_ruta_con_gemini(self.perfil)

        self.assertEqual(len(resultado.modulos), 6)
        self.assertEqual(modelos.llamadas, 2)

    def test_backend_y_base_de_datos_requieren_al_menos_diez_modulos(self):
        self.perfil.tecnologias = [
            _tecnologia("Backend"),
            _tecnologia("Base de datos"),
        ]
        respuesta_corta = json.dumps(_respuesta_valida(6))
        respuesta_valida = json.dumps(_respuesta_valida(10))
        modelos = _ModelosGeminiFalsos([respuesta_corta, respuesta_valida])
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            resultado = generar_ruta_con_gemini(self.perfil)

        self.assertEqual(len(resultado.modulos), 10)
        self.assertEqual(modelos.llamadas, 2)

    def test_falla_despues_de_todos_los_intentos_invalidos(self):
        modelos = _ModelosGeminiFalsos(["{}"] * MAX_INTENTOS_GENERACION)
        cliente = SimpleNamespace(models=modelos)

        with patch(
            "app.services.gemini_service.crear_cliente_gemini",
            return_value=cliente,
        ):
            with self.assertRaises(GeminiServiceError):
                generar_ruta_con_gemini(self.perfil)

        self.assertEqual(modelos.llamadas, MAX_INTENTOS_GENERACION)

    def test_rechaza_dependencias_ciclicas(self):
        data = _respuesta_valida(6)
        data["modulos"][0]["dependencias"] = ["modulo_6"]

        with self.assertRaisesRegex(ValidationError, "contienen un ciclo"):
            RutaIAResponse.model_validate(
                data,
                context={"minimo_modulos": 6, "maximo_modulos": 8},
            )

    def test_rechaza_dependencia_hacia_modulo_inexistente(self):
        data = _respuesta_valida(6)
        data["modulos"][1]["dependencias"] = ["modulo_inexistente"]

        with self.assertRaisesRegex(ValidationError, "no existe"):
            RutaIAResponse.model_validate(
                data,
                context={"minimo_modulos": 6, "maximo_modulos": 8},
            )

    def test_rechaza_modulos_por_encima_del_maximo(self):
        with self.assertRaisesRegex(ValidationError, "como maximo 8 modulos"):
            RutaIAResponse.model_validate(
                _respuesta_valida(9),
                context={"minimo_modulos": 6, "maximo_modulos": 8},
            )


if __name__ == "__main__":
    unittest.main()
