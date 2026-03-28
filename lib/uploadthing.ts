import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
  // Fotos de perfil de usuario
  profileImage: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(() => ({ ok: true }))
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Fotos de embarcaciones
  vesselImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => ({ ok: true }))
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
