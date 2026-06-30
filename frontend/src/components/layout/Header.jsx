import "./Layout.css";

function Header({ title = "MotorIA" }) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>Motor de personalización de rutas de aprendizaje con IA</p>
      </div>

      <button className="header__button">
        Cerrar sesión
      </button>
    </header>
  );
}

export default Header;