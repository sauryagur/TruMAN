#[repr(C)]
pub struct FFIList {
    ptr: *mut *mut u8,
    sizes_ptr: *mut usize,
    size: usize
}
impl FFIList {
    pub fn init(
        ptr: *mut *mut u8,
        sizes_ptr: *mut usize,
        size: usize
    ) -> Self {
        Self {
            ptr,
            sizes_ptr,
            size
        }
    }
    pub fn null() -> Self {
        Self {
            ptr: std::ptr::null_mut(),
            sizes_ptr: std::ptr::null_mut(),
            size: 0,
        }
    }
    pub fn to_vec(&self) -> Vec<String> {
        unsafe {
            let slices = std::slice::from_raw_parts(self.ptr, self.size);
            let sizes = std::slice::from_raw_parts(self.sizes_ptr, self.size);
            slices.iter().zip(sizes.iter()).map(|(&ptr, &len)| {
                let slice = std::slice::from_raw_parts(ptr, len);
                String::from_utf8_lossy(slice).to_string()
            }).collect::<Vec<String>>()
        }
    }

    pub fn from_vec(data: &Vec<String>) -> Self {
        let mut string_sizes: Vec<usize> = vec![0; data.len()];
        let mut strings: Vec<*mut u8> = vec![std::ptr::null_mut(); data.len()];

        for (i, item) in data.iter().enumerate() {
            let cstr = std::ffi::CString::new(item.clone()).unwrap();
            string_sizes[i] = item.len();
            strings[i] = cstr.into_raw() as *mut u8;
        }
        strings.push(std::ptr::null_mut()); // Null-terminate the array

        let ptr = strings.as_mut_ptr();
        let sizes_ptr = string_sizes.as_mut_ptr();

        Self {
            ptr,
            sizes_ptr,
            size: data.len(),
        }
    }
    pub fn spread(&self) -> (*mut *mut u8, *mut usize, usize) {
        (self.ptr, self.sizes_ptr, self.size)
    }
}