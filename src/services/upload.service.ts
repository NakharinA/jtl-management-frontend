import { apiClient } from './api.client';

interface UploadResponse {
  url: string;
  fileName: string;
}

export const uploadService = {
  uploadImage: async (file: File, folder = 'products'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiClient.postForm<UploadResponse>('/upload', formData, { folder });
    return result.url;
  },
};
