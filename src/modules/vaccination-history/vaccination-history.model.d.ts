export type VaccinationHistory = {
  id: number;
  livestockId: number;
  vaccineId: number;
  isVaccinated: boolean;
  vaccinationDate: string;
  batchNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
