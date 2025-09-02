'use client'

import { useState, useEffect } from 'react'
import { RequirePlanAccess } from '../../lib/RequirePlanAccess'
import { useAuth } from '@/app/(frontend)/context/AuthProvider'
import { fetchUserFitnessPrograms } from '@/app/(frontend)/lib/fetchFitnessPrograms'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  Dumbbell,
  Download,
  Loader2,
  Filter,
  Search,
  TrendingUp,
  Users,
  Star,
} from 'lucide-react'
import { generatePDF } from '@/lib/pdf-generator'

interface Exercise {
  name: string
  sets?: number | { $numberInt: string }
  reps: string
//   weight: string
  restTime: string
  notes: string
  duration?: string
  intensity?: string
}

interface WorkoutDay {
  day: string
  workoutType: string
  exercises: Exercise[]
  duration: string
}

interface WorkoutPlan {
  overview: string
  duration: string
  frequency: string
  weeklySchedule: WorkoutDay[]
  progressionNotes: string
  safetyTips: string[]
}

interface FitnessProgram {
  id: string
  workoutPlan: WorkoutPlan
  generatedAt: string
  createdAt: string
}

export default function WorkoutPlansPage() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<FitnessProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [openProgram, setOpenProgram] = useState<string | null>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [openExercise, setOpenExercise] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'strength' | 'cardio' | 'mixed'>('all')

  useEffect(() => {
    const loadPrograms = async () => {
      if (user?.email) {
        const fetchedPrograms = await fetchUserFitnessPrograms(user.email)
        {/* Filter to only include programs with workout plans*/}
        const workoutPrograms = fetchedPrograms.filter(program => program.workoutPlan)
        setPrograms(workoutPrograms)
      }
      setLoading(false)
    }

    loadPrograms()
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSetsValue = (sets: number | { $numberInt: string } | undefined): number => {
    if (typeof sets === 'number') return sets
    if (sets && typeof sets === 'object' && '$numberInt' in sets) {
      return parseInt(sets.$numberInt)
    }
    return 0
  }

  const toggleProgram = (programId: string) => {
    setOpenProgram(openProgram === programId ? null : programId)
    setOpenDay(null)
    setOpenExercise(null)
  }

  const toggleDay = (dayId: string) => {
    setOpenDay(openDay === dayId ? null : dayId)
    setOpenExercise(null)
  }

  const toggleExercise = (exerciseId: string) => {
    setOpenExercise(openExercise === exerciseId ? null : exerciseId)
  }

  const handleDownloadPDF = async (program: FitnessProgram) => {
    if (!user) return

    setGeneratingPDF(program.id)
    try {
      const success = await generatePDF(program, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })

      if (!success) {
        console.error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPDF(null)
    }
  }

  const getWorkoutTypeFromSchedule = (schedule: WorkoutDay[]): string => {
    const types = schedule.map(day => day.workoutType.toLowerCase())
    const hasStrength = types.some(type => type.includes('strength') || type.includes('weight'))
    const hasCardio = types.some(type => type.includes('cardio') || type.includes('running'))
    
    if (hasStrength && hasCardio) return 'mixed'
    if (hasStrength) return 'strength'
    if (hasCardio) return 'cardio'
    return 'mixed'
  }

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.workoutPlan?.overview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.workoutPlan?.weeklySchedule?.some(day => 
                           day.workoutType.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    if (filterType === 'all') return matchesSearch
    
    const workoutType = getWorkoutTypeFromSchedule(program.workoutPlan?.weeklySchedule || [])
    return matchesSearch && workoutType === filterType
  })

  const getWorkoutStats = (program: FitnessProgram) => {
    const schedule = program.workoutPlan?.weeklySchedule || []
    const totalExercises = schedule.reduce((total, day) => total + day.exercises.length, 0)
    const avgDuration = schedule.length > 0 ? 
      schedule.reduce((total, day) => {
        const duration = parseInt(day.duration.replace(/\D/g, '')) || 0
        return total + duration
      }, 0) / schedule.length : 0

    return {
      totalWorkouts: schedule.length,
      totalExercises,
      avgDuration: Math.round(avgDuration),
      workoutType: getWorkoutTypeFromSchedule(schedule)
    }
  }

  if (loading) {
    return (
      <RequirePlanAccess>
        <div className="min-h-screen bg-hero-gradient p-6">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card rounded-2xl p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-maxfit-medium-grey/20 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-maxfit-medium-grey/20 rounded w-2/3 mb-8"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-maxfit-medium-grey/10 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RequirePlanAccess>
    )
  }

  return (
    <RequirePlanAccess>
      <div className="min-h-screen bg-hero-gradient p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-maxfit-white mb-2">
                  Workout <span className="text-maxfit-neon-green text-glow">Plans</span>
                </h1>
                <p className="text-maxfit-medium-grey text-lg">
                  Your personalized AI-generated workout programs and training schedules
                </p>
              </div>

              {/* Stats Cards */}
              {programs.length > 0 && (
                <div className="flex gap-4">
                  <div className="glass-card rounded-xl p-4 text-center min-w-[80px]">
                    <div className="text-maxfit-neon-green text-2xl font-bold">{programs.length}</div>
                    <div className="text-maxfit-medium-grey text-xs">Plans</div>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center min-w-[80px]">
                    <div className="text-maxfit-neon-green text-2xl font-bold">
                      {programs.reduce((total, p) => total + (p.workoutPlan?.weeklySchedule?.length || 0), 0)}
                    </div>
                    <div className="text-maxfit-medium-grey text-xs">Workouts</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          {programs.length > 0 && (
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-maxfit-medium-grey absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search workout plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-maxfit-darker-grey/50 border border-maxfit-medium-grey/30 rounded-xl px-10 py-3 text-maxfit-white placeholder-maxfit-medium-grey focus:border-maxfit-neon-green focus:outline-none"
                  />
                </div>
                
                <div className="flex gap-2">
                  {(['all', 'strength', 'cardio', 'mixed'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        filterType === type
                          ? 'bg-maxfit-neon-green text-black'
                          : 'bg-maxfit-darker-grey/50 text-maxfit-medium-grey hover:text-maxfit-white border border-maxfit-medium-grey/30'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {filteredPrograms.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Dumbbell className="w-16 h-16 text-maxfit-medium-grey mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-maxfit-white mb-2">
                {programs.length === 0 ? 'No Workout Plans Yet' : 'No Plans Match Your Search'}
              </h3>
              <p className="text-maxfit-medium-grey mb-6">
                {programs.length === 0 
                  ? 'Start a conversation with our AI assistant to generate your first personalized workout program.'
                  : 'Try adjusting your search terms or filters to find the workout plans you\'re looking for.'
                }
              </p>
              {programs.length === 0 && (
                <button className="btn-neon px-6 py-3 rounded-lg">Generate Workout Plan</button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPrograms.map((program) => {
                const stats = getWorkoutStats(program)
                return (
                  <div key={program.id} className="glass-card rounded-2xl overflow-hidden">
                    {/* Program Header */}
                    <div className="p-6 cursor-pointer hover:bg-maxfit-medium-grey/5 transition-colors border-b border-maxfit-medium-grey/20">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center space-x-4 flex-1"
                          onClick={() => toggleProgram(program.id)}
                        >
                          <div className="flex-shrink-0">
                            {openProgram === program.id ? (
                              <ChevronDown className="w-6 h-6 text-maxfit-neon-green" />
                            ) : (
                              <ChevronRight className="w-6 h-6 text-maxfit-medium-grey" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="w-4 h-4 text-maxfit-neon-green" />
                              <span className="text-maxfit-white font-semibold">
                                {formatDate(program.createdAt)}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-maxfit-neon-green/20 text-maxfit-neon-green capitalize">
                                {stats.workoutType}
                              </span>
                            </div>
                            <p className="text-maxfit-medium-grey text-sm line-clamp-2 mb-3">
                              {program.workoutPlan?.overview}
                            </p>
                            
                            {/* Stats */}
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center space-x-1">
                                <Target className="w-4 h-4 text-maxfit-neon-green" />
                                <span className="text-maxfit-medium-grey">{stats.totalWorkouts} workouts</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Dumbbell className="w-4 h-4 text-maxfit-neon-green" />
                                <span className="text-maxfit-medium-grey">{stats.totalExercises} exercises</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-maxfit-neon-green" />
                                <span className="text-maxfit-medium-grey">~{stats.avgDuration} min avg</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadPDF(program)
                            }}
                            disabled={generatingPDF === program.id}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium bg-gradient-to-r from-lime-400 to-emerald-500 text-black hover:from-lime-500 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {generatingPDF === program.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                              </>
                            )}
                          </button>

                          <div className="text-right">
                            <div className="text-maxfit-neon-green font-semibold">
                              {program.workoutPlan?.duration}
                            </div>
                            <div className="text-maxfit-medium-grey text-sm">Duration</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Program Details */}
                    {openProgram === program.id && program.workoutPlan && (
                      <div className="p-6 bg-maxfit-darker-grey/30">
                        {/* Program Overview */}
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-maxfit-white mb-3 flex items-center">
                            <TrendingUp className="w-5 h-5 text-maxfit-neon-green mr-2" />
                            Program Overview
                          </h3>
                          <div className="glass-card rounded-xl p-4">
                            <p className="text-maxfit-medium-grey leading-relaxed mb-4">
                              {program.workoutPlan.overview}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-maxfit-neon-green font-bold text-lg">
                                  {program.workoutPlan.frequency}
                                </div>
                                <div className="text-maxfit-medium-grey text-sm">Frequency</div>
                              </div>
                              <div className="text-center">
                                <div className="text-maxfit-neon-green font-bold text-lg">
                                  {program.workoutPlan.duration}
                                </div>
                                <div className="text-maxfit-medium-grey text-sm">Duration</div>
                              </div>
                              <div className="text-center">
                                <div className="text-maxfit-neon-green font-bold text-lg">
                                  {stats.totalExercises}
                                </div>
                                <div className="text-maxfit-medium-grey text-sm">Total Exercises</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Weekly Schedule */}
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-maxfit-white mb-3 flex items-center">
                            <Calendar className="w-5 h-5 text-maxfit-neon-green mr-2" />
                            Weekly Schedule
                          </h3>
                          <div className="grid gap-3">
                            {program.workoutPlan.weeklySchedule.map((day, dayIndex) => {
                              const dayId = `${program.id}-day-${dayIndex}`
                              return (
                                <div
                                  key={dayIndex}
                                  className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                                >
                                  <div
                                    className="p-4 cursor-pointer hover:bg-maxfit-medium-grey/5 transition-colors"
                                    onClick={() => toggleDay(dayId)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                          {openDay === dayId ? (
                                            <ChevronDown className="w-5 h-5 text-maxfit-neon-green" />
                                          ) : (
                                            <ChevronRight className="w-5 h-5 text-maxfit-medium-grey" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-maxfit-white font-semibold text-lg">
                                            {day.day}
                                          </div>
                                          <div className="text-maxfit-medium-grey text-sm">
                                            {day.workoutType}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center space-x-1">
                                          <Clock className="w-4 h-4 text-maxfit-neon-green" />
                                          <span className="text-maxfit-medium-grey">
                                            {day.duration}
                                          </span>
                                        </div>
                                        <div className="bg-maxfit-neon-green/20 text-maxfit-neon-green px-3 py-1 rounded-full text-sm font-medium">
                                          {day.exercises.length} exercises
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Day Exercises */}
                                  {openDay === dayId && (
                                    <div className="p-4 pt-0 bg-maxfit-darker-grey/20">
                                      <div className="space-y-3">
                                        {day.exercises.map((exercise, exerciseIndex) => {
                                          const exerciseId = `${dayId}-exercise-${exerciseIndex}`
                                          return (
                                            <div
                                              key={exerciseIndex}
                                              className="glass-card rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                                            >
                                              <div
                                                className="p-4 cursor-pointer hover:bg-maxfit-medium-grey/5 transition-colors"
                                                onClick={() => toggleExercise(exerciseId)}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                      {openExercise === exerciseId ? (
                                                        <ChevronDown className="w-4 h-4 text-maxfit-neon-green" />
                                                      ) : (
                                                        <ChevronRight className="w-4 h-4 text-maxfit-medium-grey" />
                                                      )}
                                                    </div>
                                                    <div>
                                                      <div className="text-maxfit-white font-medium">
                                                        {exercise.name}
                                                      </div>
                                                      {exercise.sets && (
                                                        <div className="text-maxfit-medium-grey text-sm">
                                                          {getSetsValue(exercise.sets)} sets × {exercise.reps}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    {/* <div className="text-maxfit-neon-green font-semibold">
                                                      {exercise.weight}
                                                    </div> */}
                                                    {exercise.duration && (
                                                      <div className="text-maxfit-medium-grey text-xs">
                                                        {exercise.duration}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Exercise Details */}
                                              {openExercise === exerciseId && (
                                                <div className="p-4 pt-0 bg-maxfit-darker-grey/30">
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    {exercise.sets && (
                                                      <div className="glass-card rounded-lg p-3 text-center">
                                                        <div className="text-maxfit-medium-grey text-xs uppercase tracking-wide mb-1">
                                                          Sets
                                                        </div>
                                                        <div className="text-maxfit-white font-bold text-lg">
                                                          {getSetsValue(exercise.sets)}
                                                        </div>
                                                      </div>
                                                    )}
                                                    <div className="glass-card rounded-lg p-3 text-center">
                                                      <div className="text-maxfit-medium-grey text-xs uppercase tracking-wide mb-1">
                                                        Reps
                                                      </div>
                                                      <div className="text-maxfit-white font-bold text-lg">
                                                        {exercise.reps}
                                                      </div>
                                                    </div>
                                                    <div className="glass-card rounded-lg p-3 text-center">
                                                    </div>
                                                    {exercise.restTime && (
                                                      <div className="glass-card rounded-lg p-3 text-center">
                                                        <div className="text-maxfit-medium-grey text-xs uppercase tracking-wide mb-1">
                                                          Rest
                                                        </div>
                                                        <div className="text-maxfit-white font-bold text-lg">
                                                          {exercise.restTime}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                  {exercise.notes && (
                                                    <div className="glass-card rounded-lg p-3">
                                                      <div className="flex items-start space-x-2">
                                                        <AlertCircle className="w-4 h-4 text-maxfit-neon-green mt-0.5 flex-shrink-0" />
                                                        <div>
                                                          <div className="text-maxfit-white font-medium text-sm mb-1">
                                                            Exercise Notes
                                                          </div>
                                                          <p className="text-maxfit-medium-grey text-sm leading-relaxed">
                                                            {exercise.notes}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Progression Notes & Safety Tips */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="glass-card rounded-xl p-6">
                            <h4 className="text-lg font-bold text-maxfit-white mb-3 flex items-center">
                              <TrendingUp className="w-5 h-5 text-maxfit-neon-green mr-2" />
                              Progression Notes
                            </h4>
                            <p className="text-maxfit-medium-grey text-sm leading-relaxed">
                              {program.workoutPlan.progressionNotes}
                            </p>
                          </div>
                          <div className="glass-card rounded-xl p-6">
                            <h4 className="text-lg font-bold text-maxfit-white mb-3 flex items-center">
                              <AlertCircle className="w-5 h-5 text-maxfit-neon-green mr-2" />
                              Safety Tips
                            </h4>
                            <ul className="space-y-2">
                              {program.workoutPlan.safetyTips.map((tip, index) => (
                                <li
                                  key={index}
                                  className="text-maxfit-medium-grey text-sm flex items-start space-x-2"
                                >
                                  <Star className="w-3 h-3 text-maxfit-neon-green mt-1 flex-shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </RequirePlanAccess>
  )
}