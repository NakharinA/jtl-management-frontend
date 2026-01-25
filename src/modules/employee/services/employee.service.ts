import { apiClient } from '../../../services/api.client';
import { Employee } from '../types';

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees');
  },

  getById: async (id: string): Promise<Employee | null> => {
    // The API requirement doesn't explicitly list getById, so we might need to fetch all or assume the endpoint exists.
    // Given the requirement 'GET /employees', let's filter purely client side if needed, OR safer:
    // Ideally, we should request a specific endpoint. Assuming GET /employees/:id might exist or we filter from getAll.
    // However, usually detailed view needs fresh data. Let's try to find it from getAll for now as per "Mock" phase behavior
    // but using API data.
    // UPDATE: The ApiRequirement.md mentions optional recommendations on other things but list:
    // GET /employees
    // POST /employees
    // PUT /employees/:id
    // DELETE /employees/:id
    // It does not explicitly list GET /employees/:id.
    // I will implementation it by fetching all and finding one to be safe, or just returning null if we want to be strict.
    // Better path: Fetch all and find.
    const employees = await apiClient.get<Employee[]>('/employees');
    return employees.find(e => e.id === id) || null;
  },

  create: async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', employee);
  },

  update: async (id: string, data: Partial<Omit<Employee, 'id'>>): Promise<Employee | null> => {
    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/employees/${id}`);
    return true;
  },
};

