import { MediumEnum } from "podverse-helpers";
import { Equal, In } from "typeorm";
import { FeedFlagStatusStatusEnum } from "@orm/entities/feed/feedFlagStatus";

type ActiveFeedWhere = {
  channel_ids: number[] | null;
  medium_id: MediumEnum | null;
  category_id: number | null;
}

export function getActiveFeedWhere({ channel_ids, medium_id, category_id }: ActiveFeedWhere) {
  return {
    channel: {
      ...(channel_ids?.length ? { id: In(channel_ids) } : {}),
      ...(medium_id ? { medium_id: Equal(medium_id) } : {}),
      ...(category_id ? { channel_categories: { category_id: Equal(category_id) } } : {}),
      feed: {
        feed_flag_status: In([FeedFlagStatusStatusEnum.Active, FeedFlagStatusStatusEnum.AlwaysParse])
      }
    }
  };
}
