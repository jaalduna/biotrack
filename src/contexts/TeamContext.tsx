import React, { createContext, useContext, useState, useEffect } from "react";
import { teamsApi, invitationsApi, type Team, type TeamMember, type TeamInvitation } from "@/services/Api";
import { useAuth } from "./AuthContext";

interface TeamContextType {
  team: Team | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canManageTeam: boolean;
  refreshTeam: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.team_role === "owner";
  const isAdmin = user?.team_role === "admin" || user?.team_role === "owner";
  const canManageTeam = isAdmin;

  const refreshTeam = async () => {
    if (!user?.team_id) {
      setTeam(null);
      return;
    }

    try {
      const teamData = await teamsApi.get(user.team_id);
      setTeam(teamData);
    } catch (error) {
      console.error("Failed to fetch team:", error);
    }
  };

  const refreshMembers = async () => {
    if (!user?.team_id) {
      setMembers([]);
      return;
    }

    try {
      const membersData = await teamsApi.getMembers(user.team_id);
      setMembers(membersData);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  const refreshInvitations = async () => {
    if (!user?.team_id || !canManageTeam) {
      setInvitations([]);
      return;
    }

    try {
      const invitationsData = await invitationsApi.list(user.team_id);
      setInvitations(invitationsData);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    }
  };

  // Load team data when user changes
  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      await Promise.all([
        refreshTeam(),
        refreshMembers(),
        canManageTeam ? refreshInvitations() : Promise.resolve(),
      ]);
      setLoading(false);
    };

    if (user) {
      loadTeamData();
    } else {
      setTeam(null);
      setMembers([]);
      setInvitations([]);
      setLoading(false);
    }
  }, [user?.id, user?.team_id]);

  return (
    <TeamContext.Provider
      value={{
        team,
        members,
        invitations,
        loading,
        isOwner,
        isAdmin,
        canManageTeam,
        refreshTeam,
        refreshMembers,
        refreshInvitations,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
