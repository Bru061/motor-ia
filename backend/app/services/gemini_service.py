import json
from typing import Any

from pydantic import ValidationError

from app.core.config import settings
from app.models.perfil_usuario import PerfilUsuario
from app.schemas.ruta_ia import RutaIAResponse

MAX_INTENTOS_GENERACION = 2


class GeminiServiceError(Exception):
    pass


def crear_cliente_gemini():
    try:
        from google import genai
    except ImportError as exc:
        raise GeminiServiceError("google-genai no esta instalado.") from exc

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def construir_prompt(perfil: PerfilUsuario) -> str:
    tecnologias = [
        tecnologia.categoria.nombre
        for tecnologia in perfil.tecnologias
        if tecnologia.categoria is not None
    ]
    tecnologias_texto = ", ".join(tecnologias) if tecnologias else "sin categorias"

    return f"""
Genera una ruta de aprendizaje personalizada para MotorIA.

Perfil:
- Meta profesional: {perfil.meta_profesional}
- Nivel actual: {perfil.nivel_actual}
- Tecnologias de interes: {tecnologias_texto}

Devuelve exclusivamente JSON valido, sin markdown ni texto extra.

Estructura obligatoria:
{{
  "titulo": "Ruta para convertirse en Backend Developer",
  "modulos": [
    {{
      "clave": "modulo_1",
      "titulo": "Fundamentos de Python",
      "nivel": "junior",
      "orden": 1,
      "tiempo_estimado_hrs": 6,
      "recursos": [
        {{
          "titulo": "Documentacion oficial de Python",
          "tipo": "documentacion",
          "url": "https://docs.python.org/3/"
        }}
      ],
      "dependencias": []
    }}
  ]
}}

Reglas:
- Minimo 3 modulos.
- nivel: junior, intermediate o advanced.
- tipo: video, articulo o documentacion.
- dependencias usa claves internas, no UUIDs.
- URLs en texto plano, sin markdown.
""".strip()


def generar_ruta_con_gemini(perfil: PerfilUsuario) -> RutaIAResponse:
    cliente = crear_cliente_gemini()
    prompt = construir_prompt(perfil)
    ultimo_error: json.JSONDecodeError | ValidationError | ValueError | None = None

    for _ in range(MAX_INTENTOS_GENERACION):
        try:
            response = cliente.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                },
            )
        except Exception as exc:
            raise GeminiServiceError(
                "No se pudo generar la ruta con Gemini."
            ) from exc

        texto = getattr(response, "text", None)
        if not texto:
            ultimo_error = ValueError("Gemini no devolvio contenido.")
            continue

        try:
            data = _extraer_json(texto)
            return RutaIAResponse.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as exc:
            ultimo_error = exc

    raise GeminiServiceError(
        "Gemini no devolvio JSON valido despues de 2 intentos."
    ) from ultimo_error


def _extraer_json(texto: str) -> Any:
    return json.loads(texto.strip())
