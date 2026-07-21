import { getUserInitials } from "../../utils/user";

function UserAvatar({ className = "", label, size = "md", value }) {
  const initials = getUserInitials(value || label);

  return (
    <span
      className={`user-avatar user-avatar--${size} ${className}`.trim()}
      aria-label={label ? `Iniciales de ${label}` : "Avatar del usuario"}
      title={label}
    >
      {initials}
    </span>
  );
}

export default UserAvatar;
