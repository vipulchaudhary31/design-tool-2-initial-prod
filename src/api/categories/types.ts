export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  use_profile_pic: boolean;
  locations: any[];
  priority: number | null;
}
