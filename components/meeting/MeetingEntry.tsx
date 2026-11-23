"use client";

import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import { LobbySkeleton } from "./lobby/LobbySkeleton";
import type { MeetingFlowProps } from "./MeetingFlow";

const PropsContext = createContext<MeetingFlowProps | null>(null);

function Loading() {
  const props = useContext(PropsContext);
  if (!props) return null;
  return <LobbySkeleton meetingId={props.meetingId} me={props.me} preview={props.preview} timeZone={props.timeZone} />;
}

// The call client only runs in the browser, and it's large, so it loads after
// the page paints. Until then the lobby shows everything the server knew.
const MeetingFlow = dynamic(() => import("./MeetingFlow"), { ssr: false, loading: () => <Loading /> });

export function MeetingEntry(props: MeetingFlowProps) {
  return (
    <PropsContext.Provider value={props}>
      <MeetingFlow {...props} />
    </PropsContext.Provider>
  );
}
