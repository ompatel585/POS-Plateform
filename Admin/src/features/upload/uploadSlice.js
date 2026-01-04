// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import uploadService from "./uploadService";

// export const uploadImg = createAsyncThunk(
//   "upload/images",
//   async (data, thunkAPI) => {
//     try {
//       const formData = new FormData();
//       for (let i = 0; i < data.length; i++) {
//         formData.append("images", data[i]);
//       }
//       return await uploadService.uploadImg(formData);
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error);
//     }
//   }
// );
// export const delImg = createAsyncThunk(
//   "delete/images",
//   async (id, thunkAPI) => {
//     try {
//       return await uploadService.deleteImg(id);
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error);
//     }
//   }
// );
// const initialState = {
//   images: [],
//    videos: [],   // ✅ ADD THIS
//   isError: false,
//   isLoading: false,
//   isSuccess: false,
//   message: "",
// };

// export const uploadVideo = createAsyncThunk(
//   "upload/videos",
//   async (files, thunkAPI) => {
//     try {
//       const formData = new FormData();
//       files.forEach((file) => {
//         formData.append("videos", file);
//       });
//       return await uploadService.uploadVideo(formData);
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error);
//     }
//   }
// );



// export const uploadSlice = createSlice({
//   name: "imaegs",
//   initialState,
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(uploadImg.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(uploadImg.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isError = false;
//         state.isSuccess = true;
//         state.images = action.payload;
//       })
//       .addCase(uploadImg.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.isSuccess = false;
//         state.message = action.error;
//       })
//       .addCase(delImg.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(delImg.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isError = false;
//         state.isSuccess = true;
//         state.images = [];
//       })
//       .addCase(delImg.rejected, (state, action) => {
//         state.isLoading = false;
//         state.isError = true;
//         state.isSuccess = false;
//         state.message = action.payload;
//       }).addCase(uploadVideo.fulfilled, (state, action) => {
//   state.isLoading = false;
//   state.isSuccess = true;
//   state.videos = action.payload; // ✅ THIS IS THE KEY
// });
// ;
//   },
// });
// export default uploadSlice.reducer;



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import uploadService from "./uploadService";

/* ---------- IMAGE UPLOAD ---------- */
export const uploadImg = createAsyncThunk(
  "upload/images",
  async (files, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      return await uploadService.uploadImg(formData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

/* ---------- VIDEO UPLOAD ---------- */
export const uploadVideo = createAsyncThunk(
  "upload/videos",
  async (files, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("videos", file));
      return await uploadService.uploadVideo(formData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

/* ---------- DELETE IMAGE ---------- */
export const delImg = createAsyncThunk(
  "delete/image",
  async (id, thunkAPI) => {
    return await uploadService.deleteImg(id);
  }
);

/* ---------- DELETE VIDEO ---------- */
export const delVideo = createAsyncThunk(
  "delete/video",
  async (id, thunkAPI) => {
    return await uploadService.deleteVideo(id);
  }
);

const initialState = {
  images: [],
  videos: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* images */
      .addCase(uploadImg.fulfilled, (state, action) => {
        // state.images = action.payload;
        state.images.push(...action.payload);

      })
      .addCase(delImg.fulfilled, (state) => {
        state.images = [];
      })

      /* videos */
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.videos.push(...action.payload);

      })
      .addCase(delVideo.fulfilled, (state) => {
        state.videos = [];
      });
  },
});

export default uploadSlice.reducer;
