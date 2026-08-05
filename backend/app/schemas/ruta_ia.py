from typing import List, Literal
from pydantic import BaseModel, Field, ValidationInfo, model_validator


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
    actividad_practica: str = Field(min_length=1)


class RutaIAResponse(BaseModel):
    titulo: str = Field(min_length=1, max_length=255)
    modulos: List[ModuloIA] = Field(min_length=3)

    @model_validator(mode="after")
    def validar_ruta(self, info: ValidationInfo):
        claves = [m.clave for m in self.modulos]
        claves_set = set(claves)
        ordenes = [m.orden for m in self.modulos]

        if len(claves) != len(claves_set):
            raise ValueError("Las claves de modulos deben ser unicas.")

        if len(ordenes) != len(set(ordenes)):
            raise ValueError("El orden de los modulos debe ser unico.")

        if set(ordenes) != set(range(1, len(self.modulos) + 1)):
            raise ValueError("El orden de los modulos debe ser consecutivo desde 1.")

        contexto = info.context or {}
        minimo_modulos = contexto.get("minimo_modulos", 3)
        maximo_modulos = contexto.get("maximo_modulos")
        cantidad_modulos = len(self.modulos)

        if cantidad_modulos < minimo_modulos:
            raise ValueError(
                f"La ruta debe incluir al menos {minimo_modulos} modulos."
            )

        if maximo_modulos is not None and cantidad_modulos > maximo_modulos:
            raise ValueError(
                f"La ruta debe incluir como maximo {maximo_modulos} modulos."
            )

        dependencias_por_clave: dict[str, list[str]] = {}
        orden_por_clave = {modulo.clave: modulo.orden for modulo in self.modulos}

        for modulo in self.modulos:
            if len(modulo.dependencias) != len(set(modulo.dependencias)):
                raise ValueError(
                    f"El modulo {modulo.clave} tiene dependencias duplicadas."
                )

            for dep in modulo.dependencias:
                if dep == modulo.clave:
                    raise ValueError("Un modulo no puede depender de si mismo.")
                if dep not in claves_set:
                    raise ValueError(f"La dependencia {dep} no existe.")

            dependencias_por_clave[modulo.clave] = modulo.dependencias

        if cantidad_modulos > 1 and not any(dependencias_por_clave.values()):
            raise ValueError("La ruta debe incluir dependencias entre modulos.")

        visitados: set[str] = set()
        recorrido_actual: set[str] = set()

        def visitar(clave: str) -> None:
            if clave in recorrido_actual:
                raise ValueError("Las dependencias de los modulos contienen un ciclo.")
            if clave in visitados:
                return

            recorrido_actual.add(clave)
            for dependencia in dependencias_por_clave[clave]:
                visitar(dependencia)
            recorrido_actual.remove(clave)
            visitados.add(clave)

        for clave in claves:
            visitar(clave)

        for modulo in self.modulos:
            for dependencia in modulo.dependencias:
                if orden_por_clave[dependencia] >= modulo.orden:
                    raise ValueError(
                        "Un modulo solo puede depender de modulos con orden anterior."
                    )

        return self
