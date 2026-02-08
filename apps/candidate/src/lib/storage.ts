import { supabase } from './supabase'

const CANDIDATE_BUCKET = 'candidate'
const PROFILE_PHOTOS_FOLDER = 'profile_photos'
const COVER_PHOTOS_FOLDER = 'cover_photos'

export const uploadProfilePhoto = async (file: File, userId: string, type: 'profile' | 'cover' = 'profile') => {
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    const sizeLimit = type === 'cover' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > sizeLimit) {
      throw new Error(`File size must be less than ${sizeLimit / (1024 * 1024)}MB`)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const folder = type === 'cover' ? COVER_PHOTOS_FOLDER : PROFILE_PHOTOS_FOLDER
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from(CANDIDATE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from(CANDIDATE_BUCKET)
      .getPublicUrl(filePath)

    return { fileName: filePath, publicUrl }
  } catch (error) {
    throw new Error(`Profile photo upload failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const optimizeImage = async (file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(optimizedFile)
        } else {
          resolve(file)
        }
      }, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}
