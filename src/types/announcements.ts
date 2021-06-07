import { DiscardableData } from "./entities";

// GET /announcements
export interface AnnouncementListData extends DiscardableData {
  title: string;
  date: Date;
  body?: string | null;
  programmeData: {
    id: number;
    name: string;
  }; // a specific programme that the announcement is tagged to upon creation
  classData: {
    id: number;
    name: string;
  };
}

// GET /announcements/:announcementId
// no difference from AnnouncementListData
export interface AnnouncementData extends AnnouncementListData {}

// POST /announcements/create
export interface AnnouncementPostData {
  title: string;
  date: Date | string; // date to publish the announcement
  body?: string | null;
  // id of a specific class to which announcement should be tagged to, can leave empty if tagging announcement to programme
  classId?: number | null;
  // id of a specific programme to which announcement should be tagged to, will auto-tag the announcement to all of its classes
  programmeId?: number | null;
}

export interface AnnouncementDeleteData {
  announcements: number[]; // id of all announcements to delete
}
