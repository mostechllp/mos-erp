import { openCommandPalette } from "./CommandPalette";

const SearchButton = () => (
  <button
    onClick={openCommandPalette}
    className="flex items-center gap-2 h-9 md:h-10 px-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:ring-2 hover:ring-green-500 transition-all"
    aria-label="Search"
    title="Search (Ctrl+K)"
  >
    <i className="fas fa-magnifying-glass text-xs"></i>
    <span className="hidden lg:inline text-xs pr-4">Search…</span>
    <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-500">Ctrl K</kbd>
  </button>
);
export default SearchButton;
