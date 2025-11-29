export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          username: string;
          email: string | null;
          profile_image_url: string | null;
          bio: string | null;
          total_balance: number;
          available_balance: number;
          locked_balance: number;
          active_projects_as_client: number;
          active_projects_as_freelancer: number;
          reputation_score: number;
          total_projects_completed: number;
          total_disputes_raised: number;
          fraud_count: number;
          profile_nft_policy_id: string | null;
          profile_nft_asset_name: string | null;
          last_blockchain_sync: string | null;
          wallet_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username: string;
          email?: string | null;
          profile_image_url?: string | null;
          bio?: string | null;
          total_balance?: number;
          available_balance?: number;
          locked_balance?: number;
          active_projects_as_client?: number;
          active_projects_as_freelancer?: number;
          reputation_score?: number;
          total_projects_completed?: number;
          total_disputes_raised?: number;
          fraud_count?: number;
          profile_nft_policy_id?: string | null;
          profile_nft_asset_name?: string | null;
          last_blockchain_sync?: string | null;
          wallet_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string;
          email?: string | null;
          profile_image_url?: string | null;
          bio?: string | null;
          total_balance?: number;
          available_balance?: number;
          locked_balance?: number;
          active_projects_as_client?: number;
          active_projects_as_freelancer?: number;
          reputation_score?: number;
          total_projects_completed?: number;
          total_disputes_raised?: number;
          fraud_count?: number;
          profile_nft_policy_id?: string | null;
          profile_nft_asset_name?: string | null;
          last_blockchain_sync?: string | null;
          wallet_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string | null;
          freelancer_id: string | null;
          title: string;
          description: string;
          success_criteria: string;
          github_repo_url: string;
          payment_amount: number;
          collateral_rate: number;
          platform_fee: number;
          minimum_completion_percentage: number;
          deadline: string;
          accepted_at: string | null;
          submitted_at: string | null;
          completed_at: string | null;
          status:
            | "open"
            | "accepted"
            | "submitted"
            | "completed"
            | "disputed"
            | "cancelled";
          project_nft_policy_id: string | null;
          project_nft_asset_name: string | null;
          escrow_utxo_hash: string | null;
          description_hash: string | null;
          criteria_hash: string | null;
          repo_hash: string | null;
          metadata_json_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          freelancer_id?: string | null;
          title: string;
          description: string;
          success_criteria: string;
          github_repo_url: string;
          payment_amount: number;
          collateral_rate: number;
          platform_fee: number;
          minimum_completion_percentage?: number;
          deadline: string;
          accepted_at?: string | null;
          submitted_at?: string | null;
          completed_at?: string | null;
          status?:
            | "open"
            | "accepted"
            | "submitted"
            | "completed"
            | "disputed"
            | "cancelled";
          project_nft_policy_id?: string | null;
          project_nft_asset_name?: string | null;
          escrow_utxo_hash?: string | null;
          description_hash?: string | null;
          criteria_hash?: string | null;
          repo_hash?: string | null;
          metadata_json_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          freelancer_id?: string | null;
          title?: string;
          description?: string;
          success_criteria?: string;
          github_repo_url?: string;
          payment_amount?: number;
          collateral_rate?: number;
          platform_fee?: number;
          minimum_completion_percentage?: number;
          deadline?: string;
          accepted_at?: string | null;
          submitted_at?: string | null;
          completed_at?: string | null;
          status?:
            | "open"
            | "accepted"
            | "submitted"
            | "completed"
            | "disputed"
            | "cancelled";
          project_nft_policy_id?: string | null;
          project_nft_asset_name?: string | null;
          escrow_utxo_hash?: string | null;
          description_hash?: string | null;
          criteria_hash?: string | null;
          repo_hash?: string | null;
          metadata_json_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_submissions: {
        Row: {
          id: string;
          project_id: string | null;
          freelancer_id: string | null;
          pr_url: string;
          submission_notes: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          freelancer_id?: string | null;
          pr_url: string;
          submission_notes?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          freelancer_id?: string | null;
          pr_url?: string;
          submission_notes?: string | null;
          submitted_at?: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          project_id: string | null;
          initiated_by_user_id: string | null;
          arbitrator_id: string | null;
          reason: string;
          evidence_links: string[] | null;
          ai_decision_winner: string | null;
          ai_completion_percentage: number | null;
          ai_confidence_score: number | null;
          ai_reasoning: string | null;
          ai_analyzed_at: string | null;
          redispute_requested: boolean;
          redispute_reason: string | null;
          redispute_deadline: string | null;
          arbitrator_decision: string | null;
          arbitrator_completion_percentage: number | null;
          arbitrator_notes: string | null;
          arbitrator_decided_at: string | null;
          state: "pending" | "ai_resolved" | "human_review" | "resolved";
          dispute_nft_policy_id: string | null;
          dispute_nft_asset_name: string | null;
          dispute_utxo_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          initiated_by_user_id?: string | null;
          arbitrator_id?: string | null;
          reason: string;
          evidence_links?: string[] | null;
          ai_decision_winner?: string | null;
          ai_completion_percentage?: number | null;
          ai_confidence_score?: number | null;
          ai_reasoning?: string | null;
          ai_analyzed_at?: string | null;
          redispute_requested?: boolean;
          redispute_reason?: string | null;
          redispute_deadline?: string | null;
          arbitrator_decision?: string | null;
          arbitrator_completion_percentage?: number | null;
          arbitrator_notes?: string | null;
          arbitrator_decided_at?: string | null;
          state?: "pending" | "ai_resolved" | "human_review" | "resolved";
          dispute_nft_policy_id?: string | null;
          dispute_nft_asset_name?: string | null;
          dispute_utxo_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          initiated_by_user_id?: string | null;
          arbitrator_id?: string | null;
          reason?: string;
          evidence_links?: string[] | null;
          ai_decision_winner?: string | null;
          ai_completion_percentage?: number | null;
          ai_confidence_score?: number | null;
          ai_reasoning?: string | null;
          ai_analyzed_at?: string | null;
          redispute_requested?: boolean;
          redispute_reason?: string | null;
          redispute_deadline?: string | null;
          arbitrator_decision?: string | null;
          arbitrator_completion_percentage?: number | null;
          arbitrator_notes?: string | null;
          arbitrator_decided_at?: string | null;
          state?: "pending" | "ai_resolved" | "human_review" | "resolved";
          dispute_nft_policy_id?: string | null;
          dispute_nft_asset_name?: string | null;
          dispute_utxo_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      arbitrators: {
        Row: {
          id: string;
          user_id: string | null;
          is_available: boolean;
          arbitration_score: number;
          total_cases_resolved: number;
          accuracy_rate: number;
          arbitrator_utxo_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          is_available?: boolean;
          arbitration_score?: number;
          total_cases_resolved?: number;
          accuracy_rate?: number;
          arbitrator_utxo_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          is_available?: boolean;
          arbitration_score?: number;
          total_cases_resolved?: number;
          accuracy_rate?: number;
          arbitrator_utxo_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type:
            | "project_accepted"
            | "work_submitted"
            | "dispute_raised"
            | "ai_analysis_complete"
            | "redispute_window_ending"
            | "arbitrator_assigned"
            | "funds_released"
            | "penalty_applied"
            | "project_cancelled";
          title: string;
          message: string;
          project_id: string | null;
          dispute_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type:
            | "project_accepted"
            | "work_submitted"
            | "dispute_raised"
            | "ai_analysis_complete"
            | "redispute_window_ending"
            | "arbitrator_assigned"
            | "funds_released"
            | "penalty_applied"
            | "project_cancelled";
          title: string;
          message: string;
          project_id?: string | null;
          dispute_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?:
            | "project_accepted"
            | "work_submitted"
            | "dispute_raised"
            | "ai_analysis_complete"
            | "redispute_window_ending"
            | "arbitrator_assigned"
            | "funds_released"
            | "penalty_applied"
            | "project_cancelled";
          title?: string;
          message?: string;
          project_id?: string | null;
          dispute_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      project_history: {
        Row: {
          id: string;
          project_id: string | null;
          action: string;
          actor_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          action: string;
          actor_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          action?: string;
          actor_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_status:
        | "open"
        | "accepted"
        | "submitted"
        | "completed"
        | "disputed"
        | "cancelled";
      dispute_state: "pending" | "ai_resolved" | "human_review" | "resolved";
      notification_type:
        | "project_accepted"
        | "work_submitted"
        | "dispute_raised"
        | "ai_analysis_complete"
        | "redispute_window_ending"
        | "arbitrator_assigned"
        | "funds_released"
        | "penalty_applied"
        | "project_cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
