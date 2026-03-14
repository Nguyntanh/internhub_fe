export interface MicroTask {

  id: number
  title: string
  description: string
  deadline?: string
  status: string

}

export interface TaskSkill {

  skillId: number
  skillName: string
  weight: number
  score?: number
  comment?: string

}

export interface TaskDetail {

  id: number
  title: string
  description: string
  status: string
  skills: TaskSkill[]

}