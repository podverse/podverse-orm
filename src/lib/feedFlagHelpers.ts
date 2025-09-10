import { FeedFlagStatusStatusEnum } from "@orm/entities/feed/feedFlagStatus";
import { In } from "typeorm";

export function getActiveFeedWhere(channel_ids?: number[]) {
  return {
    channel: {
      ...(channel_ids?.length ? { id: In(channel_ids) } : {}),
      feed: {
        feed_flag_status: In([FeedFlagStatusStatusEnum.Active, FeedFlagStatusStatusEnum.AlwaysParse])
      }
    }
  };
}
