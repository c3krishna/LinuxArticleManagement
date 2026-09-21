import { Search } from 'lucide-react';

function SearchBar({ keyword, setKeyword }) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
                type="text"
                placeholder="Search documents..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 pl-9 pr-3 text-[14px] text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
        </div>
    );
}

export default SearchBar;
