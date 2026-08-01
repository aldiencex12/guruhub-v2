"use client";
import { showAlert } from "@/utils/alert";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { assessmentsService } from "@/services/assessments";
import { classesService } from "@/services/classes";
import { subjectsService } from "@/services/subjects";
import { assessmentCategoriesService } from "@/services/assessment-categories";
import { teachersService } from "@/services/teachers";
import { academicYearsService } from "@/services/academic-years";
import { classMembersService } from "@/services/class-members";
import { useAuthStore } from "@/store/auth.store";
import type { 
  Assessment, 
  Class, 
  Subject, 
  AssessmentCategory, 
  Teacher, 
  AcademicYear,
  ClassMember,
  AssessmentType
} from "@/types";
import { 
  BarChart3, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Check, 
  Info, 
  Calendar, 
  Award,
  ChevronRight,
  BookOpen,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, getAssessmentTypeLabel } from "@/lib/utils";

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: "DAILY_TEST", label: "Ulangan Harian" },
  { value: "ASSIGNMENT", label: "Tugas" },
  { value: "PROJECT", label: "Proyek" },
  { value: "PRACTICAL", label: "Praktik" },
  { value: "MIDTERM", label: "UTS / PTS" },
  { value: "FINAL", label: "UAS / PAS" },
];

export default function MobileAssessmentsPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  // Navigation State
  const [view, setView] = useState<"list" | "create" | "edit" | "scores">("list");

  const { data: assessments = [], isLoading: loadingAssessments, refetch: refetchAssessments } = useQuery<Assessment[]>({ 
    queryKey: ["assessments"],
    queryFn: () => assessmentsService.getAll(),
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery<Class[]>({ 
    queryKey: ["classes"],
    queryFn: () => classesService.getAll(),
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<Subject[]>({ 
    queryKey: ["subjects"],
    queryFn: () => subjectsService.getAll(),
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<AssessmentCategory[]>({ 
    queryKey: ["categories"],
    queryFn: () => assessmentCategoriesService.getAll(),
  });

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<Teacher[]>({ 
    queryKey: ["teachers"],
    queryFn: () => teachersService.getAll(),
  });

  const { data: academicYears = [], isLoading: loadingAcademicYears } = useQuery({ 
    queryKey: ["academicYears"],
    queryFn: () => academicYearsService.getAll(),
    select: (list) => (list || []).map((ay: any) => ({
      id: ay.id,
      name: ay.name || ay.year || "Tahun Ajaran",
      semester: ay.semester || "Ganjil",
      startDate: ay.startDate || "",
      endDate: ay.endDate || "",
      isActive: ay.isActive || false,
    })),
  });

  const loading = loadingAssessments || loadingClasses || loadingSubjects || loadingCategories || loadingTeachers || loadingAcademicYears;

  // Selected Item / Input Mode States
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [scoresData, setScoresData] = useState<Record<number, { score: string; notes: string }>>({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [submittingScores, setSubmittingScores] = useState(false);

  // Filters
  const [filterClassId, setFilterClassId] = useState<string>("ALL");

  // Form States (Create / Edit)
  const [formTitle, setFormTitle] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formAcademicYearId, setFormAcademicYearId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAssessmentType, setFormAssessmentType] = useState<AssessmentType>("DAILY_TEST");
  const [formAssessmentDate, setFormAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [formMaxScore, setFormMaxScore] = useState<number>(100);
  const [submittingForm, setSubmittingForm] = useState(false);

  useEffect(() => {
    if (classes.length > 0 && !formClassId) {
      setFormClassId(String(classes[0].id));
    }
  }, [classes, formClassId]);

  useEffect(() => {
    if (subjects.length > 0 && !formSubjectId) {
      setFormSubjectId(String(subjects[0].id));
    }
  }, [subjects, formSubjectId]);

  useEffect(() => {
    if (categories.length > 0 && !formCategoryId) {
      setFormCategoryId(String(categories[0].id));
    }
  }, [categories, formCategoryId]);

  useEffect(() => {
    if (academicYears.length > 0 && !formAcademicYearId) {
      const activeAY = academicYears.find((ay: any) => ay.isActive) || academicYears[0];
      if (activeAY) setFormAcademicYearId(String(activeAY.id));
    }
  }, [academicYears, formAcademicYearId]);

  useEffect(() => {
    if (teachers.length > 0 && !formTeacherId) {
      if (currentUser?.email) {
        const matched = teachers.find(t => t.email?.toLowerCase() === currentUser.email.toLowerCase());
        if (matched) {
          setFormTeacherId(String(matched.id));
        } else {
          setFormTeacherId(String(teachers[0].id));
        }
      } else {
        setFormTeacherId(String(teachers[0].id));
      }
    }
  }, [teachers, currentUser, formTeacherId]);

  // Load scores for selected assessment
  const loadScoresData = async (assessment: Assessment) => {
    setView("scores");
    setSelectedAssessment(assessment);
    setLoadingScores(true);
    try {
      const detail = await assessmentsService.getById(assessment.id);
      const members = await classMembersService.getAll({ classId: assessment.classId });
      setClassMembers(members);

      const scoresMap: Record<number, { score: string; notes: string }> = {};
      
      // Initialize with empty scores
      members.forEach((m) => {
        if (m.studentId) {
          scoresMap[m.studentId] = { score: "", notes: "" };
        }
      });

      // Override with existing scores from API
      if (detail && detail.scores) {
        detail.scores.forEach((s) => {
          scoresMap[s.studentId] = {
            score: s.score !== undefined && s.score !== null && s.score !== 0 ? String(s.score) : "",
            notes: s.notes || "",
          };
        });
      }

      setScoresData(scoresMap);
    } catch (err) {
      toast.error("Gagal memuat daftar nilai");
    } finally {
      setLoadingScores(false);
    }
  };

  // Open Create Form
  const openCreateForm = () => {
    setView("create");
    setFormTitle("");
    setFormAssessmentType("DAILY_TEST");
    setFormAssessmentDate(new Date().toISOString().split("T")[0]);
    setFormMaxScore(100);
    if (classes.length > 0) setFormClassId(String(classes[0].id));
    if (subjects.length > 0) setFormSubjectId(String(subjects[0].id));
    if (categories.length > 0) setFormCategoryId(String(categories[0].id));
    const activeAY = academicYears.find((ay: any) => ay.isActive) || academicYears[0];
    if (activeAY) setFormAcademicYearId(String(activeAY.id));
  };

  // Open Edit Form
  const openEditForm = (assessment: Assessment) => {
    setView("edit");
    setSelectedAssessment(assessment);
    setFormTitle(assessment.title);
    setFormClassId(String(assessment.classId));
    setFormSubjectId(String(assessment.subjectId));
    setFormTeacherId(String(assessment.teacherId));
    setFormAcademicYearId(String(assessment.academicYearId));
    setFormCategoryId(String(assessment.categoryId));
    setFormAssessmentType(assessment.assessmentType);
    setFormAssessmentDate(assessment.assessmentDate.split("T")[0]);
    setFormMaxScore(assessment.maxScore);
  };

  // Handle Create / Update Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Judul penilaian wajib diisi");
      return;
    }

    setSubmittingForm(true);
    const payload = {
      title: formTitle,
      classId: Number(formClassId),
      subjectId: Number(formSubjectId),
      teacherId: Number(formTeacherId),
      academicYearId: Number(formAcademicYearId),
      categoryId: Number(formCategoryId),
      assessmentType: formAssessmentType,
      assessmentDate: formAssessmentDate,
      maxScore: Number(formMaxScore),
    };

    try {
      if (view === "create") {
        await assessmentsService.create(payload);
        toast.success("Penilaian berhasil ditambahkan!");
        showAlert("Berhasil", "Penilaian berhasil ditambahkan!", "success");
      } else if (view === "edit" && selectedAssessment) {
        await assessmentsService.update(selectedAssessment.id, payload);
        toast.success("Penilaian berhasil diperbarui!");
        showAlert("Berhasil", "Penilaian berhasil diperbarui!", "success");
      }
      setView("list");
      refetchAssessments();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan penilaian");
    } finally {
      setSubmittingForm(false);
    }
  };

  // Handle Delete Assessment
  const handleDeleteAssessment = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus penilaian ini beserta semua nilai siswanya?")) {
      return;
    }
    try {
      await assessmentsService.delete(id);
      toast.success("Penilaian berhasil dihapus");
      showAlert("Berhasil", "Penilaian berhasil dihapus!", "success");
      refetchAssessments();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus penilaian");
    }
  };

  // Handle Score Change
  const handleScoreValueChange = (studentId: number, val: string, max: number) => {
    if (val !== "") {
      const num = Number(val);
      if (num < 0 || num > max) return; // limit to valid bounds
    }
    setScoresData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: val,
      }
    }));
  };

  // Handle Score Note Change
  const handleScoreNoteChange = (studentId: number, val: string) => {
    setScoresData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: val,
      }
    }));
  };

  // Set all scores at once
  const setAllScores = (val: string) => {
    setScoresData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        updated[Number(k)] = { ...updated[Number(k)], score: val };
      });
      return updated;
    });
  };

  // Save scores to server
  const handleSaveScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setSubmittingScores(true);

    const payload = Object.entries(scoresData).map(([studentIdStr, data]) => ({
      studentId: Number(studentIdStr),
      score: Number(data.score || 0),
      notes: data.notes || undefined,
    }));

    try {
      await assessmentsService.saveScores(selectedAssessment.id, payload);
      toast.success("Nilai siswa berhasil disimpan!");
      showAlert("Berhasil", "Nilai siswa berhasil disimpan!", "success");
      setView("list");
      refetchAssessments();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nilai");
    } finally {
      setSubmittingScores(false);
    }
  };

  // Filter assessments
  const filteredAssessments = assessments.filter((a) => {
    if (filterClassId !== "ALL" && String(a.classId) !== filterClassId) return false;
    return true;
  });

  const hasBelowKkm = Object.values(scoresData).some(
    data => data.score !== "" && Number(data.score) < 75
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Memuat halaman...</span>
      </div>
    );
  }

  const typeBadgeColor = (type: AssessmentType) => {
    switch (type) {
      case "DAILY_TEST": return "bg-indigo-55 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400";
      case "ASSIGNMENT": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
      case "PROJECT": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "PRACTICAL": return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
      case "MIDTERM": return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
      case "FINAL": return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400";
      default: return "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          {view !== "list" ? (
            <button
              onClick={() => setView("list")}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          )}
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {view === "list" && "Penilaian & Nilai"}
            {view === "create" && "Tambah Penilaian"}
            {view === "edit" && "Edit Penilaian"}
            {view === "scores" && "Input Nilai Siswa"}
          </span>
        </div>

        {view === "list" && (
          <button
            onClick={openCreateForm}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        )}
      </div>

      {/* VIEW: ASSESSMENT LIST */}
      {view === "list" && (
        <div className="space-y-4">
          {/* Class Filter Dropdown */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Filter Kelas</label>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List Content */}
          <div className="space-y-3">
            {filteredAssessments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-xs text-gray-500 dark:text-gray-400 shadow-sm">
                <Info className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                Belum ada data penilaian terdaftar.
              </div>
            ) : (
              filteredAssessments.map((a) => {
                const targetClass = classes.find(c => c.id === a.classId);
                const targetSubject = subjects.find(sub => sub.id === a.subjectId);

                return (
                  <div
                    key={a.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3 hover:border-indigo-200 dark:hover:border-indigo-950 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-bold text-gray-950 dark:text-white">
                          {a.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                          Kelas {a.class?.name || targetClass?.name || "-"} • Mapel {a.subject?.name || targetSubject?.name || "-"}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase", typeBadgeColor(a.assessmentType))}>
                            {getAssessmentTypeLabel(a.assessmentType)}
                          </span>
                          <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-450 px-2 py-0.5 rounded text-[8px] font-mono">
                            Maks Skor: {a.maxScore}
                          </span>
                          {a.scores?.some(s => s.score !== null && s.score !== undefined && s.score < 75) && (
                            <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 border border-rose-100 dark:border-rose-900/20">
                              <AlertTriangle className="h-3 w-3 text-rose-500 animate-pulse" />
                              Nilai &lt; KKM (75)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(a)}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-500 dark:text-gray-450 rounded-lg transition"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssessment(a.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800/80">
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        {formatDate(a.assessmentDate)}
                      </div>
                      <button
                        onClick={() => loadScoresData(a)}
                        className="flex items-center gap-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 transition-all active:scale-95"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Input / Edit Nilai
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW: CREATE / EDIT FORM */}
      {(view === "create" || view === "edit") && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3">
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Judul Penilaian *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Ulangan Harian 1 - Aljabar"
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Kelas *</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Mata Pelajaran *</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - Kls {s.gradeLevel}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Kategori *</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Tipe Penilaian *</label>
                <select
                  value={formAssessmentType}
                  onChange={(e) => setFormAssessmentType(e.target.value as AssessmentType)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {ASSESSMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Tanggal *</label>
                <input
                  type="date"
                  required
                  value={formAssessmentDate}
                  onChange={(e) => setFormAssessmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Skor Maksimal *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formMaxScore}
                  onChange={(e) => setFormMaxScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Guru Pengampu *</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Tahun Ajaran *</label>
                <select
                  value={formAcademicYearId}
                  onChange={(e) => setFormAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  {academicYears.map((ay: any) => (
                    <option key={ay.id} value={ay.id}>{ay.name} ({ay.semester})</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={submittingForm}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            {submittingForm ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                <Check className="h-4.5 w-4.5" />
                {view === "create" ? "Tambah Penilaian" : "Perbarui Penilaian"}
              </>
            )}
          </button>
        </form>
      )}

      {/* VIEW: INPUT STUDENT SCORES */}
      {view === "scores" && selectedAssessment && (
        <form onSubmit={handleSaveScores} className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider bg-gray-55 dark:bg-gray-850 px-2 py-0.5 rounded">
                Info Penilaian
              </span>
              <h3 className="text-xs font-black text-gray-900 dark:text-white mt-1.5">
                {selectedAssessment.title}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Skor Maksimal: <span className="font-bold text-indigo-650 dark:text-indigo-400">{selectedAssessment.maxScore}</span>
              </p>
            </div>

            {/* Quick Set Score Buttons */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <span className="text-[9px] text-gray-500 font-bold mr-1">Set Semua:</span>
              {[100, 90, 80, 75, 0].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setAllScores(String(score))}
                  className="px-2 py-1 rounded-md text-[9px] font-bold border border-gray-200 dark:border-gray-850 hover:bg-gray-100 text-gray-700 dark:text-gray-300"
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {hasBelowKkm && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 px-3 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 animate-pulse" />
              <span>Perhatian: Terdapat siswa dengan nilai di bawah KKM (75).</span>
            </div>
          )}

          {/* Student list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 px-1">
              Daftar Nilai Siswa ({classMembers.length} Orang)
            </h4>

            {loadingScores ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Memuat nilai...</span>
              </div>
            ) : classMembers.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-xs text-gray-500 dark:text-gray-400 shadow-sm">
                Belum ada siswa terdaftar di kelas untuk penilaian ini.
              </div>
            ) : (
              classMembers.map((member, index) => {
                const sId = member.studentId!;
                const currentScore = scoresData[sId]?.score ?? "";
                const currentNote = scoresData[sId]?.notes ?? "";

                return (
                  <div
                    key={member.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 w-5">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-950 dark:text-white">
                            {member.student?.name}
                          </span>
                          <span className="text-[9px] text-gray-400">NISN: {member.student?.nisn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-center">
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Nilai (0–{selectedAssessment.maxScore})</label>
                      <input
                        type="number"
                        min={0}
                        max={selectedAssessment.maxScore}
                        placeholder="Skor"
                        value={currentScore}
                        onChange={(e) => handleScoreValueChange(sId, e.target.value, selectedAssessment.maxScore)}
                        data-score-index={index}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            const nextInput = document.querySelector(`input[data-score-index="${index + 1}"]`) as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                              nextInput.select();
                            }
                          } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            const nextInput = document.querySelector(`input[data-score-index="${index + 1}"]`) as HTMLInputElement;
                            if (nextInput) {
                              nextInput.focus();
                              nextInput.select();
                            }
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            const prevInput = document.querySelector(`input[data-score-index="${index - 1}"]`) as HTMLInputElement;
                            if (prevInput) {
                              prevInput.focus();
                              prevInput.select();
                            }
                          }
                        }}
                        className={cn(
                          "col-span-2 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-850 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold text-right",
                          currentScore !== "" && Number(currentScore) < 75 && "border-rose-300 dark:border-rose-800/80 bg-rose-50/30 dark:bg-rose-950/10 text-rose-600 dark:text-rose-455"
                        )}
                      />
                    </div>

                    <input
                      type="text"
                      tabIndex={-1}
                      placeholder="Catatan nilai (contoh: Remedial, Tugas telat)"
                      value={currentNote}
                      onChange={(e) => handleScoreNoteChange(sId, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[10px] bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                );
              })
            )}
          </div>

          {!loadingScores && classMembers.length > 0 && (
            <button
              type="submit"
              disabled={submittingScores}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {submittingScores ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Check className="h-4.5 w-4.5" />
                  Simpan Nilai
                </>
              )}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
