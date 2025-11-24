export interface ScorePart {
  c1: number;
  c2: number;
  c3: number;
  exam: number;
}

export interface Student {
  id: string;        // Unique instance ID in the class
  masterId?: string; // Reference to master DB
  no: string;
  studentId: string;
  name: string;
  midterm: ScorePart;
  final: ScorePart;
}

export interface MasterStudent {
  id: string;
  name: string;
  originalClass: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "3/1"
  students: Student[];
}

export interface Subject {
  id: string;
  code: string; // e.g. "MA101"
  name: string; // e.g. "Mathematics"
  classes: ClassRoom[];
}

export type StudentFormData = Omit<Student, 'id'>;