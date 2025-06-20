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
    
    pub fn new() -> Self {
        // Create an empty but valid FFIList
        let empty_vec: Vec<String> = Vec::new();
        Self::from_vec(&empty_vec)
    }
    pub fn to_vec(&self) -> Vec<String> {
        if self.ptr.is_null() || self.sizes_ptr.is_null() || self.size == 0 {
            return Vec::new();
        }
        unsafe {
            let slices = std::slice::from_raw_parts(self.ptr, self.size);
            let sizes = std::slice::from_raw_parts(self.sizes_ptr, self.size);
            slices.iter().zip(sizes.iter()).map(|(&ptr, &len)| {
                if ptr.is_null() {
                    return String::new();
                }
                let slice = std::slice::from_raw_parts(ptr, len);
                String::from_utf8_lossy(slice).to_string()
            }).collect::<Vec<String>>()
        }
    }

    pub fn from_vec(data: &Vec<String>) -> Self {
        if data.is_empty() {
            return Self::null();
        }
        
        unsafe {
            // Allocate memory for string pointers and sizes
            let ptr = libc::malloc(data.len() * std::mem::size_of::<*mut u8>()) as *mut *mut u8;
            let sizes_ptr = libc::malloc(data.len() * std::mem::size_of::<usize>()) as *mut usize;
            
            // Copy each string
            for (i, s) in data.iter().enumerate() {
                let bytes = s.as_bytes();
                let len = bytes.len();
                
                // Allocate memory for string content
                let str_ptr = libc::malloc(len) as *mut u8;
                std::ptr::copy_nonoverlapping(bytes.as_ptr(), str_ptr, len);
                
                // Set pointers and sizes
                *ptr.add(i) = str_ptr;
                *sizes_ptr.add(i) = len;
            }
            
            Self {
                ptr,
                sizes_ptr,
                size: data.len(),
            }
        }
    }
    pub fn spread(&self) -> (*mut *mut u8, *mut usize, usize) {
        (self.ptr, self.sizes_ptr, self.size)
    }
}
impl Default for FFIList {
    fn default() -> Self {
        Self::new()
    }
}