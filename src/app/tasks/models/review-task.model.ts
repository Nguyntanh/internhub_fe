export interface ReviewSkillRequest {

  skillId: number
  score: number
  comment: string

}

export interface ReviewTaskRequest {

  skills: ReviewSkillRequest[]

}