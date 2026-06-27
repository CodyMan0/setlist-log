import SearchView from "../../components/SearchView";
import type { Feed } from "../../lib/feed";
import data from "../../../data/intouch.json";

export default function IntouchSearch() {
  return (
    <SearchView
      feed={data as Feed}
      title="인터치 워십 검색"
      lead="언제 어떤 찬양"
    />
  );
}
