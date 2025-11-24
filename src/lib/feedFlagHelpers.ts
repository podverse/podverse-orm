import { MediumEnum } from "podverse-helpers";
import { Equal, In } from "typeorm";
import { FeedFlagStatusStatusEnum } from "@orm/entities/feed/feedFlagStatus";

type ActiveFeedWhere = {
  channel_ids: number[] | null;
  medium_id: MediumEnum | null;
}

export function getActiveFeedWhere({ channel_ids, medium_id }: ActiveFeedWhere) {
  return {
    channel: {
      ...(medium_id ? { medium_id: Equal(medium_id) } : {}),
      ...(channel_ids?.length ? { id: In(channel_ids) } : {}),
      feed: {
        feed_flag_status: In([FeedFlagStatusStatusEnum.Active, FeedFlagStatusStatusEnum.AlwaysParse])
      }
    }
  };
}
