alter table public."userQueueItems"
drop constraint "FK_5d3167b5c0df34e3a550fd8d6e8",
add constraint "FK_5d3167b5c0df34e3a550fd8d6e8"
   foreign key ("mediaRefId")
   references "mediaRefs"("id")
   on delete cascade;
