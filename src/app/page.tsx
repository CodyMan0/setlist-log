import SearchView from "../components/SearchView";
import type { Feed } from "../lib/feed";
import data from "../../data/setlists.json";

export default function FridaySearch() {
  return (
    <SearchView
      feed={data as Feed}
      title="금요예배 찬양 검색"
      lead="언제 어떤 찬양"
    />
  );
}
