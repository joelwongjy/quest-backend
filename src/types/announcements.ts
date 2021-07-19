import { DiscardableData } from "./entities";

// GET /announcements
export interface AnnouncementListData extends DiscardableData {
  title: string;
  startDate: Date;
  endDate: Date;
  body?: string | null;
  programmesData: {
    id: number;
    name: string;
  }[]; // any program that has at least 1 class with this announcement will be included in this list
  classesData: {
    id: number;
    name: string;
  }[]; // all classes associated with the announcement
}

// GET /announcements/:announcementId
// no difference from AnnouncementListData
export interface AnnouncementData extends AnnouncementListData {}

// POST /announcements/create
export interface AnnouncementPostData {
  title: string;
  startDate: Date | string; // date to publish the announcement
  endDate: Date | string; // date for announcement to expire
  body?: string | null;
  // id of any programme to which announcement should be tagged to, will auto-tag this announcement to all of its classes
  // can leave empty if creating announcement for some class(es) only
  programmeIds: number[];
  // id of all classes to which announcement should be tagged to, can leave empty if tagging announcement to programme
  classIds: number[];
}

// DELETE /announcements/delete/:id
export interface AnnouncementDeleteData {
  id: number; // id of the announcement to delete
}

export interface AnnouncementPatchData {
  title?: string;
  startDate?: Date;
  endDate?: Date;
  body?: string | null;
  programmeIds?: number[];
  classIds?: number[];
}
