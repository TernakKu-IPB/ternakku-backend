<p align="center">
  <img src="/docs/images/vertical-ternakku.png" alt="TernakKu Logo" width="180">
</p>

<p align="center">

![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</p>

---

## 📖 Deskripsi

**TernakKu** adalah aplikasi sistem informasi manajemen berbasis digital yang dirancang untuk membantu peternak dalam mengelola seluruh aktivitas operasional peternakan secara lebih mudah, cepat, dan terstruktur.

Aplikasi ini menggantikan proses pencatatan manual menjadi sistem pencatatan digital yang terintegrasi. Melalui TernakKu, peternak dapat mengelola profil peternakan, memetakan pembagian kandang, mencatat data dan mutasi ternak, serta memantau riwayat kondisi setiap individu ternak secara real-time (mulai dari fase kelahiran, inseminasi buatan, vaksinasi, riwayat penyakit, hingga status penjualan atau kematian).

Dengan digitalisasi pencatatan tersebut, TernakKu diharapkan mampu meningkatkan efisiensi operasional, menjaga akurasi data, serta membantu meningkatkan produktivitas usaha peternakan.

---

## 🎯 Tujuan Pengembangan

TernakKu dikembangkan untuk membantu peternak dalam:

- Melakukan digitalisasi pencatatan operasional peternakan.
- Memetakan manajemen lokasi (kandang) secara akurat.
- Mengurangi kesalahan pencatatan manual dan rekam jejak ternak.
- Mempermudah pemantauan kondisi dan riwayat perpindahan (*transfer*) setiap ternak.
- Meningkatkan efisiensi pengelolaan usaha peternakan secara keseluruhan.

## 📌 Use Case

```mermaid
flowchart LR
    Peternak((Peternak))
    Admin((Admin))
    
    subgraph Aplikasi TernakKu
        direction TB
        UC1([Registrasi Akun])
        UC2([Login])
        UC3([Kelola Profil Pengguna])
        UC4([Kelola Peternakan & Kandang])
        UC5([Manajemen Data & Mutasi Ternak])
        UC6([Input Riwayat Kondisi Ternak])
        UC7([Kelola Master Data: Tipe Hewan & Kondisi])
    end
    
    %% Relasi Peternak
    Peternak --- UC1
    Peternak --- UC2
    Peternak --- UC3
    Peternak --- UC4
    Peternak --- UC5
    Peternak --- UC6
    
    %% Relasi Admin
    Admin --- UC2
    Admin --- UC3
    Admin --- UC7
    
    %% Relasi Include (Harus Login terlebih dahulu)
    UC3 -.->|<< include >>| UC2
    UC4 -.->|<< include >>| UC2
    UC5 -.->|<< include >>| UC2
    UC6 -.->|<< include >>| UC2
    UC7 -.->|<< include >>| UC2
```

1. **UC1: Registrasi Akun**: Peternak mendaftarkan diri jika belum memiliki akun.

2. **UC2: Login**: Akses masuk ke dalam sistem menggunakan kredensial yang sudah didaftarkan, berlaku untuk Peternak dan Admin sesuai role masing-masing.

3. **UC3: Kelola Profil Pengguna**: Memperbarui informasi personal pengguna (Peternak/Admin).

4. **UC4: Kelola Peternakan & Kandang**: Peternak memperbarui informasi peternakan yang dikelola serta mengatur daftar kandang beserta kapasitasnya.

4. **UC5: Manajemen Data & Mutasi Ternak**: Peternak melihat daftar ternak, menambah/mengubah data hewan, serta melakukan proses transfer (pindah kandang) antar ternak.

5. **UC6: Input Riwayat Kondisi Ternak**: Peternak mencatat kondisi atau kejadian spesifik pada ternak (misal: lahir, sakit, vaksin) berdasarkan tipe kondisi baku dari sistem.

8. **UC7: Kelola Master Data**: Admin sistem bertugas mengelola (menambah/merubah) parameter baku secara global, seperti jenis hewan (Sapi, Kambing) dan tipe kondisi ternak (Vaksin, Sakit, dll).

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
    
    %% Cabang 1: Pengaturan Tempat
    Pilihan -->|Persiapan Lokasi| Master[Kelola Info Peternakan & Daftar Kandang]
    
    %% Cabang 2: Manajemen Inventaris & Mutasi
    Pilihan -->|Kelola Inventaris| Ternak[Tambah/Ubah Profil Ternak & Mutasi Pindah Kandang]
    
    %% Cabang 3: Operasional Harian
    Pilihan -->|Pencatatan Harian| Riwayat[Input Riwayat / Kondisi Ternak Aktual]
    
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
    - **Persiapan Lokasi (Kandang)**: Dilakukan saat pertama kali menggunakan aplikasi atau ketika ada penambahan lahan. Peternak mendaftarkan peternakan dan membaginya ke dalam beberapa blok kandang.
    - **Manajemen Inventaris & Mutasi**: Dilakukan ketika ada penambahan ternak baru, pembaruan profil hewan, atau ketika ternak harus dipindahkan dari satu kandang ke kandang lain (mutasi).
    - **Pencatatan Harian**: Aktivitas operasional rutin. Peternak mencatat kondisi ternak secara aktual menggunakan parameter yang sudah disediakan sistem (misalnya: pencatatan vaksinasi atau riwayat sakit).

4. **Siklus Berulang**: Setelah menyelesaikan satu tugas, peternak kembali ke Dashboard untuk melakukan tugas lain atau memilih keluar (logout) jika pekerjaan selesai.

## 🗄️ Entity Relationship Diagram (ERD)

![Entity Reational Database](/docs/images/erd.png)