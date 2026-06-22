# Laporan Pengembangan Aplikasi Mindful Pulse

## 1. DESKRIPSI APLIKASI
**Mindful Pulse** adalah aplikasi *wellness-tracker* berbasis web yang dirancang khusus untuk mahasiswa guna mengelola kesehatan fisik dan mental di tengah kesibukan akademik. 

*   **Tujuan**: Membantu mahasiswa menjaga keseimbangan antara performa akademik dan kesejahteraan diri melalui pelacakan kebiasaan dan dukungan AI.
*   **Target Pengguna**: Mahasiswa universitas yang menghadapi stres akademik, manajemen waktu yang buruk, atau pengabaian kesehatan fisik.
*   **Masalah yang Diselesaikan**: Kurangnya kesadaran akan hidrasi, pola tidur, manajemen tugas yang membebani, serta kebutuhan akan motivasi yang personal.
*   **Fitur Unggulan**:
    *   **The Daily 5**: Dashboard ringkas untuk memantau 5 metrik kesehatan harian.
    *   **AI Wellness Coach**: Asisten bertenaga Gemini yang memberikan rekomendasi berdasarkan data perilaku pengguna.
    *   **Gamification**: Sistem *streak* dan *achievements* untuk memotivasi konsistensi pengguna.

---

## 2. FUNGSI-FUNGSI UTAMA

### 2.1 Fungsi Water Tracker
*   **Tambah Air**: Pengguna dapat menambah jumlah asupan air (ml atau L).
*   **Progress %**: Menampilkan persentase pencapaian terhadap target harian (default 3L).
*   **Mode Puasa**: Penyesuaian pengingat dan target saat periode puasa.

### 2.2 Fungsi Mood Tracker
*   **Pilih Mood**: Input skala perasaan 1-4.
*   **Simpan Jurnal**: Catatan teks untuk refleksi diri.
*   **Riwayat**: Melihat tren perasaan selama seminggu terakhir untuk deteksi dini stres.

### 2.3 Fungsi Jadwal Kuliah
*   **Tambah Jadwal**: Menyimpan data mata kuliah, ruang, dan jam.
*   **Tampil Hari Ini**: Secara dinamis menampilkan jadwal yang relevan dengan hari berjalan di dashboard.

### 2.4 Fungsi Analytics
*   **Grafik Mingguan**: Visualisasi data air, langkah, dan mood selama 7 hari.
*   **Perbandingan Data**: Membandingkan performa hari ini dengan rata-rata mingguan.

### 2.5 Fungsi AI Insight
*   **Rekomendasi Otomatis**: AI menganalisis data (misal: "Anda kurang minum hari ini") dan memberikan motivasi instan.
*   **Breakdown Tugas**: Menguraikan tugas kuliah yang besar menjadi sub-tugas yang lebih kecil.

### 2.6 Fungsi Tambah Tugas
*   **Input Tugas**: Penambahan tugas dengan prioritas (High/Medium/Low) dan kategori (Fokus/Kuliah/Kerja).

---

## 3. DOKUMENTASI OOP & FP

### 3.1 Object-Oriented Programming (OOP)
Aplikasi menggunakan pola OOP untuk layanan (services) guna mengenkapsulasi logika bisnis yang kompleks dan menjaga *single source of truth*.

*   **Class Utama**: `AIService`
*   **Atribut**:
    *   `instance`: Menyimpan instance singleton.
    *   `lastAnalysisTime`: Melacak waktu analisis terakhir untuk *throttling*.
*   **Method**:
    *   `getInstance()`: Mengakses singleton service.
    *   `generateContext()`: Mengumpulkan data store menjadi objek konteks AI.
    *   `analyzeWellness()`: Melakukan request ke API Gemini.

**Contoh Kode OOP:**
```typescript
class AIService {
  private static instance: AIService;
  private lastAnalysisTime: number = 0;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async analyzeWellness(force: boolean = false): Promise<AIAnalysisResult | null> {
    const context = this.generateContext();
    try {
      const response = await fetch("/api/ai/analyze-wellness", {
        method: "POST",
        body: JSON.stringify({ context }),
      });
      return await response.json();
    } catch (error) {
      this.handleError(error, "Wellness Analysis");
      return null;
    }
  }
}
```

### 3.2 Functional Programming (FP)
Logika kalkulasi dan manipulasi data di dalam store dan utility menggunakan prinsip FP agar bersifat *pure* dan mudah diuji.

*   **Fungsi FP**: `calculateDailyWellnessScore`, `shouldUpdateStreak`, `isStreakBroken`.
*   **Teknik**: Menggunakan `map`, `filter`, dan *immutability*.

**Contoh Kode FP:**
```typescript
// Pure Function menggunakan arrow function dan immutability
export const calculateDailyWellnessScore = (state: WellnessState, date: string): number => {
  const water = state.waterLogs[date] || 0;
  const steps = state.stepsLogs[date] || 0;

  const weights = { water: 0.5, steps: 0.5 };
  const scores = {
    water: Math.min(water / state.baseWaterGoal, 1),
    steps: Math.min(steps / state.stepGoal, 1),
  };

  return Math.round((scores.water * weights.water + scores.steps * weights.steps) * 100);
};

// Penggunaan Filter (FP) untuk mendapatkan tugas belum selesai
const pendingTasks = tasks.filter((task) => !task.completed);
```

---

## 4. ERROR HANDLING

Aplikasi menerapkan sistem pertahanan berlapis untuk menangani kegagalan sistem maupun kesalahan input.

*   **Input Tidak Valid**: Validasi di tingkat store menggunakan `Math.max` untuk mencegah nilai negatif (misal: jumlah langkah).
*   **Data Kosong**: Penggunaan *optional chaining* (`?.`) dan nilai default (`|| 0`) untuk mencegah aplikasi crash saat data belum diisi.
*   **Koneksi API**: Implementasi *try-catch* blok pada `AIService` dan `syncService`.
*   **Throttling**: Mencegah serangan atau pemborosan kuota API melalui pengecekan `THROTTLE_MS`.

**Contoh Kode Try-Catch:**
```typescript
try {
  const response = await fetch("/api/tasks/breakdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskTitle }),
  });

  if (!response.ok) throw new Error("Backend decomposition service unavailable.");
  
  const data = await response.json();
  return data.subtasks;
} catch (error) {
  console.error("AIService [Task Breakdown]: Critical Failure", error);
  return ["Persiapan", "Pengerjaan", "Finalisasi"]; // Fallback Data
}
```

---

## 5. TEKNIK PENGUJIAN

Pengujian dilakukan untuk memastikan setiap fitur berjalan sesuai spesifikasi di berbagai kondisi.

*   **Unit Test**: Menguji fungsi kalkulasi skor wellness dan logika reset streak secara terisolasi.
*   **Integration Test**: Memastikan data yang diinput di Water Tracker tersinkronisasi dengan Dashboard dan AI Insight.
*   **UI Test**: Pengujian responsivitas pada layar mobile dan animasi transisi menggunakan Motion.
*   **Edge Case**: Memasukkan nilai 0 pada target harian, atau mengakses aplikasi saat offline (Firebase Offline Persistence).

### Hasil Pengujian (Summary)

| Fitur | Jenis Test | Kondisi | Status |
|---|---|---|---|
| Water Tracker | Unit | Input -250ml (negatif) | **PASS** (Auto-reset ke 0) |
| Mood Tracker | Integration | Simpan mood -> Update Streak | **PASS** |
| AI Insight | Integration | API Timeout | **PASS** (Tampil pesan fallback) |
| Dashboard | UI | Ukuran layar iPhone SE | **PASS** (Layout responsif) |
| Task List | Edge Case | Nama tugas 500+ karakter | **PASS** (Text wrapping aktif) |
| Auth | Integration | Login salah password | **PASS** (Error message tampil) |

---
*Laporan ini dihasilkan secara otomatis sebagai dokumentasi teknis Mindful Pulse.*
