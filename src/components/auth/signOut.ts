/** Konfirmasi sebelum keluar. Mengembalikan true bila siswa setuju. */
export function confirmSignOut(hasLocalOnlyImages: boolean): boolean {
  const base =
    'Keluar dari akun?\n\nJawaban Anda sudah tersimpan di akun dan akan muncul lagi saat Anda masuk. ' +
    'Data di perangkat ini akan dihapus agar tidak terbaca siswa lain.';
  const images = hasLocalOnlyImages
    ? '\n\nPerhatian: foto dan sketsa belum tersimpan ke akun pada versi ini dan akan ikut terhapus dari perangkat ini.'
    : '';
  return window.confirm(base + images);
}
