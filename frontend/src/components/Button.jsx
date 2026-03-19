function Button({ children, onClick, type = "submit" }) {
  return (
    <button type={type} onClick={onClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
      {children}
    </button>
  );
}

export default Button;
