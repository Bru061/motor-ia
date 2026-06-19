from typing import List, Literal
from pydantic import BaseModel, Field, model_validator


class RecursoIA(BaseModel):
    titulo: str = Field(min_length=1, max_length=255)
    tipo: Literal["video", "articulo", "documentacion"]
    url: str = Field(min_length=1, max_length=500)


class ModuloIA(BaseModel):
    clave: str = Field(min_length=1, max_length=100)
    titulo: str = Field(min_length=1, max_length=255)
    nivel: Literal["junior", "intermediate", "advanced"]
    orden: int = Field(gt=0)
    tiempo_estimado_hrs: int = Field(gt=0)
    recursos: List[RecursoIA] = Field(min_length=1)
    dependencias: List[str] = Field(default_factory=list)


class RutaIAResponse(BaseModel):
    titulo: str = Field(min_length=1, max_length=255)
    modulos: List[ModuloIA] = Field(min_length=3)

    @model_validator(mode="after")
    def validar_dependencias(self):
        claves = [m.clave for m in self.modulos]
        claves_set = set(claves)

        if len(claves) != len(claves_set):
            raise ValueError("Las claves de modulos deben ser unicas.")

        for modulo in self.modulos:
            for dep in modulo.dependencias:
                if dep == modulo.clave:
                    raise ValueError("Un modulo no puede depender de si mismo.")
                if dep not in claves_set:
                    raise ValueError(f"La dependencia {dep} no existe.")

        return self