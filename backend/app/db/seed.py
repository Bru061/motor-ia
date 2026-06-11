from app.db.session import SessionLocal
from app.models.categoria_tecnologia import CategoriaTecnologia


def seed_categorias():
    db = SessionLocal()
    try:
        # Verificar si ya hay categorías
        existing = db.query(CategoriaTecnologia).first()
        if existing:
            print("Las categorías ya están cargadas.")
            return

        categorias = [
            CategoriaTecnologia(
                nombre="Frontend",
                descripcion="Desarrollo de interfaces de usuario: HTML, CSS, JavaScript, React, Vue, Angular"
            ),
            CategoriaTecnologia(
                nombre="Backend",
                descripcion="Desarrollo del servidor y lógica de negocio: Python, Node.js, Java, FastAPI, Django"
            ),
            CategoriaTecnologia(
                nombre="Base de datos",
                descripcion="Gestión y modelado de datos: PostgreSQL, MySQL, MongoDB, Redis, SQLAlchemy"
            ),
            CategoriaTecnologia(
                nombre="DevOps",
                descripcion="Infraestructura y despliegue: Docker, Kubernetes, CI/CD, AWS, Railway, Vercel"
            ),
            CategoriaTecnologia(
                nombre="Data Science",
                descripcion="Análisis de datos e inteligencia artificial: Python, Pandas, NumPy, Machine Learning"
            ),
            CategoriaTecnologia(
                nombre="Mobile",
                descripcion="Desarrollo de aplicaciones móviles: React Native, Flutter, Swift, Kotlin"
            ),
            CategoriaTecnologia(
                nombre="Seguridad",
                descripcion="Ciberseguridad y buenas prácticas: autenticación, autorización, OWASP, JWT"
            ),
            CategoriaTecnologia(
                nombre="Control de versiones",
                descripcion="Gestión del código fuente: Git, GitHub, GitLab, estrategias de branching"
            ),
        ]

        for categoria in categorias:
            db.add(categoria)

        db.commit()
        print(f"{len(categorias)} categorías cargadas exitosamente.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_categorias()