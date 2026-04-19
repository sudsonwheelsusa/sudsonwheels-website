export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <span className="font-bold text-sm">SudsOnWheels</span>
        <span className="text-sm" style={{ color: "#9ab8d4" }}>
          Serving Ashland &amp; North Central Ohio
        </span>
        <span className="text-xs" style={{ color: "#445566" }}>
          &copy; {new Date().getFullYear()} SudsOnWheels
        </span>
      </div>
    </footer>
  );
}