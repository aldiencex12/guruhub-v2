"use client";

import { useState, useEffect } from "react";
import { Calculator, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClasses } from "@/queries/classes.query";
import { useSubjects } from "@/queries/subjects.query";
import { useCalculateClass } from "@/queries/grade-engine.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import type { GradeResult } from "@/types";
import { getGradeLetter, getGradeColor } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useSchedules } from "@/queries/schedules.query";

export default function GradeEnginePage() {
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: academicYears = [] } = useAcademicYears();
  const { data: schedules = [] } = useSchedules();
  const { currentUser } = useAuthStore();

  const [classId, setClassId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [yearId, setYearId] = useState<string>("");
  const [results, setResults] = useState<GradeResult[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<number[]>([]);

  const calculateClass = useCalculateClass();

  // Sync defaults when lookup options load
  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(String(classes[0].id));
    }
  }, [classes, classId]);

  // Determine subjects taught by the current teacher (if teacher role)
  useEffect(() => {
    if (currentUser?.role === "Teacher" && schedules?.length) {
      const ids = Array.from(new Set(schedules.map((s) => s.subjectId)));
      setTeacherSubjectIds(ids);
    } else {
      setTeacherSubjectIds([]);
    }
  }, [schedules, currentUser]);

  // Filter subjects based on teacher's assignments
  const filteredSubjects = currentUser?.role === "Teacher"
    ? subjects.filter((s) => teacherSubjectIds.includes(s.id))
    : subjects;

  useEffect(() => {
    if (filteredSubjects.length > 0 && !subjectId) {
      setSubjectId(String(filteredSubjects[0].id));
    }
  }, [filteredSubjects, subjectId]);

  useEffect(() => {
    if (academicYears.length > 0 && !yearId) {
      const activeAy = academicYears.find((ay) => ay.isActive) || academicYears[0];
      if (activeAy) {
        setYearId(String(activeAy.id));
      }
    }
  }, [academicYears, yearId]);

  const handleCalculate = async () => {
    if (!classId || !subjectId || !yearId) return;

    try {
      const data = await calculateClass.mutateAsync({
        classId: Number(classId),
        subjectId: Number(subjectId),
        academicYearId: Number(yearId),
      });
      setResults(data || []);
      setCalculated(true);
      toast.success(`Nilai dihitung untuk ${(data || []).length} siswa`);
    } catch {}
  };

  const selectedClass = classes.find((c) => c.id === Number(classId));
  const selectedSubject = filteredSubjects.find((s) => s.id === Number(subjectId));

  const gradeDistribution = results.reduce((acc, r) => {
    acc[r.gradeLetter] = (acc[r.gradeLetter] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-indigo-600" /> Kalkulasi Nilai Akhir
        </h1>
        <p className="text-sm text-gray-500 mt-1">Hitung nilai akhir berdasarkan bobot kategori penilaian</p>
      </div>

      {/* Filter + Calculate */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 flex-1">
              <Label>Kelas</Label>
              <Select value={classId} onChange={(e) => { setClassId(e.target.value); setCalculated(false); }}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Mata Pelajaran</Label>
              <Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setCalculated(false); }}>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - {s.gradeLevel}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Tahun Ajaran</Label>
              <Select value={yearId} onChange={(e) => { setYearId(e.target.value); setCalculated(false); }}>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.name} — {ay.semester}</option>
                ))}
              </Select>
            </div>
            <Button onClick={handleCalculate} loading={calculateClass.isPending} className="gap-2 flex-shrink-0" disabled={classes.length === 0 || filteredSubjects.length === 0}>
              <PlayCircle className="h-4 w-4" />
              Hitung Nilai
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grade scale reference */}
      <div className="grid grid-cols-4 gap-3">
        {[{ range: "90–100", letter: "A", desc: "Sangat Baik", color: "emerald" },
          { range: "80–89", letter: "B", desc: "Baik", color: "blue" },
          { range: "70–79", letter: "C", desc: "Cukup", color: "amber" },
          { range: "< 70", letter: "D", desc: "Perlu Bimbingan", color: "red" }].map((g) => (
          <Card key={g.letter} className="text-center">
            <CardContent className="py-4">
              <div className={`text-2xl font-bold mb-1 ${g.color === "emerald" ? "text-emerald-600" : g.color === "blue" ? "text-blue-600" : g.color === "amber" ? "text-amber-600" : "text-red-600"}`}>{g.letter}</div>
              <div className="text-xs font-mono text-gray-500">{g.range}</div>
              <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
              {calculated && gradeDistribution[g.letter] !== undefined && (
                <Badge variant="secondary" className="mt-2">{gradeDistribution[g.letter]} siswa</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results */}
      {calculated && (
        <Card>
          <CardHeader>
            <CardTitle>
              Hasil — Kelas {selectedClass?.name} | {selectedSubject?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Tidak ada data nilai untuk kelas dan mata pelajaran ini.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Peringkat</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Nilai Akhir</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-5 uppercase">Huruf Mutu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {results.map((r, i) => (
                      <tr key={r.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"}`}>{i + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{r.student?.name?.charAt(0) || "S"}</div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{r.student?.name || `Siswa #${r.studentId}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div className={`h-full rounded-full ${r.gradeLetter === "A" ? "bg-emerald-500" : r.gradeLetter === "B" ? "bg-blue-500" : r.gradeLetter === "C" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${r.finalScore}%` }} />
                            </div>
                            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{r.finalScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${getGradeColor(r.gradeLetter)}`}>{r.gradeLetter}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
