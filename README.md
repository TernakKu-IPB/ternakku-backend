<p align="center">
  <img src="docs/images/vertical-ternakku.png" alt="TernakKu Logo" width="180">
</p>

<p align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

</p>

---

## 📖 Deskripsi

**TernakKu** adalah aplikasi sistem informasi manajemen berbasis digital yang dirancang untuk membantu peternak dalam mengelola seluruh aktivitas operasional peternakan secara lebih mudah, cepat, dan terstruktur.

Aplikasi ini menggantikan proses pencatatan manual menjadi sistem pencatatan digital yang terintegrasi. Melalui TernakKu, peternak dapat mengelola profil peternakan, mencatat data ternak, serta memantau riwayat kondisi setiap individu ternak secara real-time, mulai dari fase kelahiran, inseminasi buatan, vaksinasi, riwayat penyakit, hingga status penjualan maupun kematian.

Dengan digitalisasi pencatatan tersebut, TernakKu diharapkan mampu meningkatkan efisiensi operasional, menjaga akurasi data, serta membantu meningkatkan produktivitas usaha peternakan.

---

## 🎯 Tujuan Pengembangan

TernakKu dikembangkan untuk membantu peternak dalam:

- Melakukan digitalisasi pencatatan peternakan.
- Mengurangi kesalahan pencatatan manual.
- Mempermudah pemantauan kondisi setiap ternak.
- Menyediakan riwayat ternak yang lengkap dan terdokumentasi.
- Meningkatkan efisiensi pengelolaan usaha peternakan.

## 📌 Use Case

```mermaid
flowchart LR
    Peternak((Peternak))
    
    subgraph Aplikasi TernakKu
        direction TB
        UC1([Registrasi Akun])
        UC2([Login])
        UC3([Kelola Profil Peternak])
        UC4([Kelola Informasi Peternakan])
        UC5([Lihat Daftar Ternak])
        UC6([Kelola Data Ternak])
        UC7([Kelola Tipe Kondisi Ternak])
    end
    
    Peternak --- UC1
    Peternak --- UC2
    Peternak --- UC3
    Peternak --- UC4
    Peternak --- UC5
    Peternak --- UC6
    Peternak --- UC7
    
    %% Relasi Include (Harus Login terlebih dahulu)
    UC2 -.->|<< include >>| UC1
    UC3 -.->|<< include >>| UC2
    UC4 -.->|<< include >>| UC2
    UC5 -.->|<< include >>| UC2
    UC6 -.->|<< include >>| UC2
    UC7 -.->|<< include >>| UC2
```

1. **UC1: Registrasi Akun**: Peternak mendaftarkan diri jika belum memiliki akun.

2. **UC2: Login**: Akses masuk ke dalam sistem menggunakan kredensial yang sudah didaftarkan.

3. **UC3: Kelola Profil Peternak**: Memperbarui informasi personal peternak.

4. **UC4: Kelola Informasi Peternakan**: Memperbarui informasi peternakan yang sedang dikelola.

4. **UC5: Lihat Daftar Ternak**: Menampilkan semua ternak yang dimiliki beserta informasi lengkapnya.

5. **UC6: Kelola Data Ternak**: Menambah, mengubah, atau menghapus profil ternak beserta kondisinya.

8. **UC7: Kelola Tipe Kondisi Ternak**: Menambah, mengubah, atau menghapus tipe kondisi ternak (misalnya lahir, vaksin, sakit, atau tipe kustom).

---

## ⚙️ Activity Diagram

```mermaid
flowchart TD
    Start([Mulai Aktivitas]) --> CekAkun{Sudah Punya Akun?}
    
    CekAkun -- Belum --> Registrasi[Registrasi Akun]
    Registrasi --> Login
    CekAkun -- Sudah --> Login[Login ke Aplikasi]
    
    Login --> Dashboard[Akses Dashboard Utama]
    
    Dashboard --> Pilihan{Pilih Aktivitas Bisnis}
    
    %% Cabang 1: Pengaturan Master Data
    Pilihan -->|Persiapan Data Awal| Master[Kelola Profil, Info Peternakan, & Tipe Kondisi]
    
    %% Cabang 2: Manajemen Inventaris Ternak
    Pilihan -->|Kelola Inventaris| Ternak[Tambah / Ubah / Hapus Data Ternak]
    
    %% Cabang 3: Operasional Harian
    Pilihan -->|Pencatatan Harian| Riwayat[Input Kejadian / Kondisi Ternak Aktual]
    
    %% Kembali ke pusat aktivitas
    Master --> Dashboard
    Ternak --> Dashboard
    Riwayat --> Dashboard
    
    %% Selesai
    Pilihan -->|Selesai Bekerja| Logout[Keluar Aplikasi / Logout]
    Logout --> Finish([Selesai])
```

1. **Titik Masuk (Autentikasi)**: Peternak memulai dengan mengecek apakah sudah memiliki akun. Jika belum, peternak melakukan registrasi terlebih dahulu, kemudian login ke dalam sistem.

2. **Pusat Kendali (Dashboard)**: Setelah berhasil login, peternak diarahkan ke Dashboard sebagai pusat kendali untuk memilih aktivitas yang akan dilakukan.

3. **Tiga Pilar Aktivitas Bisnis:**
    - **Persiapan Data Awal**: Biasanya dilakukan saat pertama kali menggunakan aplikasi atau jika ada perubahan mendasar (memperbarui nama peternakan atau menambah tipe kondisi baru seperti "Karantina").
    - **Kelola Inventaris Ternak**: Dilakukan ketika ada ternak baru yang masuk ke peternakan (beli/lahir) atau mengubah identitas ternak.
    - **Pencatatan Harian**: Aktivitas yang paling sering dilakukan (rutinitas). Peternak mencatat kondisi ternak secara real-time (misalnya: ternak A divaksin hari ini, ternak B sakit).

4. **Siklus Berulang**: Setelah menyelesaikan satu tugas, peternak kembali ke Dashboard untuk melakukan tugas lain atau memilih keluar (logout) jika pekerjaan selesai.
