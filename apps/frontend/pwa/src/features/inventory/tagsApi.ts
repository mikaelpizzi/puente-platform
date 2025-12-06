import { api } from '../../app/api';

export interface Tag {
  _id: string;
  name: string;
  sellerId: string;
  color: string;
}

export const tagsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTags: builder.query<Tag[], void>({
      query: () => '/tags',
      providesTags: ['Tags'],
    }),
    createTag: builder.mutation<Tag, { name: string; color?: string }>({
      query: (newTag) => ({
        url: '/tags',
        method: 'POST',
        body: newTag,
      }),
      invalidatesTags: ['Tags'],
    }),
    deleteTag: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tags'],
    }),
  }),
});

export const { useGetTagsQuery, useCreateTagMutation, useDeleteTagMutation } = tagsApi;
