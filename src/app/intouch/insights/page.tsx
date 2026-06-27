import RankingView from "../../../components/RankingView";
import type { Feed } from "../../../lib/feed";
import data from "../../../../data/intouch.json";

export default function IntouchRanking() {
  return <RankingView feed={data as Feed} />;
}
