import json
from typing import Any

from pydantic import ValidationError

from app.core.config import settings
from app.models.perfil_usuario import PerfilUsuario
from app.schemas.ruta_ia import RutaIAResponse

MAX_INTENTOS_GENERACION = 3


class GeminiServiceError(Exception):
    pass


def crear_cliente_gemini():
    try:
        from google import genai
    except ImportError as exc:
        raise GeminiServiceError("google-genai no esta instalado.") from exc

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _obtener_tecnologias(perfil: PerfilUsuario) -> list[str]:
    tecnologias: list[str] = []
    categorias_vistas: set[str] = set()

    for tecnologia in perfil.tecnologias:
        categoria = getattr(tecnologia, "categoria", None)
        nombre = getattr(categoria, "nombre", "").strip()
        if not nombre:
            continue

        categoria_id = getattr(categoria, "id", None)
        clave = str(categoria_id) if categoria_id is not None else nombre.casefold()
        if clave in categorias_vistas:
            continue

        categorias_vistas.add(clave)
        tecnologias.append(nombre)

    return tecnologias


def obtener_limites_modulos(cantidad_categorias: int) -> tuple[int, int]:
    if cantidad_categorias <= 1:
        return 6, 8
    if cantidad_categorias == 2:
        return 10, 12
    return 12, 15


def construir_prompt(perfil: PerfilUsuario) -> str:
    tecnologias = _obtener_tecnologias(perfil)
    tecnologias_texto = ", ".join(tecnologias) if tecnologias else "sin categorias"
    minimo_modulos, maximo_modulos = obtener_limites_modulos(len(tecnologias))

    return f"""
Genera una ruta de aprendizaje completa, concreta y progresiva para MotorIA.

Perfil:
- Meta profesional: {perfil.meta_profesional}
- Nivel actual: {perfil.nivel_actual}
- Tecnologias de interes: {tecnologias_texto}
- Cantidad de categorias seleccionadas: {len(tecnologias)}

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
      "dependencias": [],
      "actividad_practica": "Escribe un script en Python que lea un archivo y calcule el promedio de una columna numerica."
    }}
  ]
}}

Reglas:
- Genera entre {minimo_modulos} y {maximo_modulos} modulos, ambos limites incluidos.
- No generes una ruta resumida ni agrupes demasiados temas en un solo modulo.
- Cada modulo debe representar un paso concreto, especifico y progresivo.
- Distribuye la ruta entre fundamentos, contenido intermedio, contenido avanzado y un proyecto aplicado final.
- Usa nivel junior para fundamentos, intermediate para contenido intermedio y advanced para contenido avanzado y el proyecto aplicado.
- Cubre todas las categorias seleccionadas de forma equilibrada. Si hay varias, dedica una cantidad comparable de modulos a cada una e integra sus conocimientos en el proyecto final.
- Cada modulo debe incluir entre 1 y 3 recursos pertinentes.
- Las claves deben ser unicas y seguir el formato modulo_1, modulo_2, etc.
- orden debe ser unico, consecutivo y comenzar en 1.
- nivel: junior, intermediate o advanced.
- tipo: video, articulo o documentacion.
- dependencias usa claves internas, no UUIDs.
- Una dependencia siempre debe apuntar a un modulo con orden anterior.
- Ningun modulo puede depender de si mismo, de una clave inexistente ni formar ciclos.
- Salvo los modulos introductorios raiz, conecta cada modulo con al menos un prerrequisito anterior cuando corresponda.
- URLs en texto plano, sin markdown.
- actividad_practica: una sola actividad breve (1-2 oraciones) para poner en practica lo visto en ese modulo especifico. No es una evaluacion ni un examen, es una sugerencia practica y accionable (ej. "construye...", "escribe...", "configura..."). Debe ser especifica al contenido del modulo, no generica.
""".strip()


def generar_ruta_con_gemini(perfil: PerfilUsuario) -> RutaIAResponse:
    cliente = crear_cliente_gemini()
    tecnologias = _obtener_tecnologias(perfil)
    minimo_modulos, maximo_modulos = obtener_limites_modulos(len(tecnologias))
    prompt_base = construir_prompt(perfil)
    prompt_intento = prompt_base
    ultimo_error: json.JSONDecodeError | ValidationError | ValueError | None = None

    for _ in range(MAX_INTENTOS_GENERACION):
        try:
            response = cliente.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt_intento,
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
            return RutaIAResponse.model_validate(
                data,
                context={
                    "minimo_modulos": minimo_modulos,
                    "maximo_modulos": maximo_modulos,
                },
            )
        except (json.JSONDecodeError, ValidationError) as exc:
            ultimo_error = exc
            prompt_intento = f"""
{prompt_base}

La respuesta anterior fue invalida. Genera nuevamente el JSON completo y verifica especialmente que contenga entre {minimo_modulos} y {maximo_modulos} modulos, con orden consecutivo y dependencias aciclicas hacia modulos anteriores.
""".strip()

    raise GeminiServiceError(
        f"Gemini no genero una ruta valida y completa despues de {MAX_INTENTOS_GENERACION} intentos."
    ) from ultimo_error


def _extraer_json(texto: str) -> Any:
    return json.loads(texto.strip())
