import RankingView from "../../components/RankingView";
import type { Feed } from "../../lib/feed";
import data from "../../../data/setlists.json";

export default function FridayRanking() {
  return <RankingView feed={data as Feed} />;
}
