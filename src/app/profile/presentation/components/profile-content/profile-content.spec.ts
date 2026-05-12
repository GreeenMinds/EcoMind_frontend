import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CommunityService } from '../../../../community/application/community.service';
import { Achievement } from '../../../../community/domain/model/achievement.entity';
import { Community } from '../../../../community/domain/model/community.entity';
import { CommunityPost } from '../../../../community/domain/model/community-post.entity';
import { Event } from '../../../../community/domain/model/event.entity';
import { UserAchievement } from '../../../../community/domain/model/user-achievement.entity';
import { MonetizationApi } from '../../../../monetization/infrastructure/monetization-api';
import { CosmeticEntity } from '../../../../monetization/domain/cosmetic.entity';
import { UserCosmeticEntity } from '../../../../monetization/domain/user-cosmetic.entity';
import { ProfileService } from '../../../application/profile.service';
import { FamilyInvitation } from '../../../domain/model/family-invitation.entity';
import { Family } from '../../../domain/model/family.entity';
import { FamilyUser } from '../../../domain/model/family-user.entity';
import { Friend } from '../../../domain/model/friend.entity';
import { User } from '../../../domain/model/user.entity';
import { QuestsService } from '../../../../quests/application/quests.service';
import { Activity } from '../../../../quests/domain/model/activity.entity';
import { Quest } from '../../../../quests/domain/model/quest.entity';
import { QuestUser } from '../../../../quests/domain/model/quest-user.entity';
import { ProfileContent } from './profile-content';

const createUser = (overrides: Partial<User>): User => Object.assign(new User(), overrides);
const createFamily = (overrides: Partial<Family>): Family => Object.assign(new Family(), overrides);
const createFamilyUser = (overrides: Partial<FamilyUser>): FamilyUser =>
  Object.assign(new FamilyUser(), overrides);
const createFamilyInvitation = (overrides: Partial<FamilyInvitation>): FamilyInvitation =>
  Object.assign(new FamilyInvitation(), overrides);
const createFriend = (overrides: Partial<Friend>): Friend => Object.assign(new Friend(), overrides);
const createAchievement = (overrides: Partial<Achievement>): Achievement =>
  Object.assign(new Achievement(), overrides);
const createCommunity = (overrides: Partial<Community>): Community =>
  Object.assign(new Community(), overrides);
const createCommunityPost = (overrides: Partial<CommunityPost>): CommunityPost =>
  Object.assign(new CommunityPost(), overrides);
const createEvent = (overrides: Partial<Event>): Event => Object.assign(new Event(), overrides);
const createUserAchievement = (overrides: Partial<UserAchievement>): UserAchievement =>
  Object.assign(new UserAchievement(), overrides);
const createCosmetic = (overrides: Partial<CosmeticEntity>): CosmeticEntity =>
  Object.assign(new CosmeticEntity(), overrides);
const createUserCosmetic = (overrides: Partial<UserCosmeticEntity>): UserCosmeticEntity =>
  Object.assign(new UserCosmeticEntity(), overrides);

class ProfileServiceStub {
  readonly createFriendCalls: Friend[] = [];
  readonly createFamilyInvitationCalls: FamilyInvitation[] = [];

  private readonly currentUserSignal = signal(
    createUser({
      id: 1,
      community_id: 1,
      email: 'carlos@ecomind.test',
      birth_date: '1985-04-12',
      name: 'Carlos Mendoza',
      streak: 7,
      commitment: 'I will reduce my energy consumption.',
      registered_at: '2026-05-01',
      gem_balance: 400,
      ecopoints: 420,
    }),
  );

  readonly currentUserProfile = this.currentUserSignal.asReadonly();
  readonly currentUserId = computed(() => 1);

  private readonly users = [
    this.currentUserSignal(),
    createUser({
      id: 2,
      community_id: 1,
      email: 'nico@ecomind.test',
      birth_date: '2013-09-21',
      name: 'Nico Mendoza',
      streak: 3,
      commitment: 'I will use less plastic.',
      registered_at: '2026-05-01',
      gem_balance: 350,
      ecopoints: 160,
    }),
    createUser({
      id: 3,
      community_id: 1,
      email: 'lucia@ecomind.test',
      birth_date: '1992-06-17',
      name: 'Lucia Perez',
      streak: 5,
      commitment: 'I will recycle more.',
      registered_at: '2026-05-03',
      gem_balance: 280,
      ecopoints: 210,
    }),
  ];

  refreshCurrentUser() {
    return of(this.currentUserSignal());
  }

  getUsers() {
    return of(this.users);
  }

  getCurrentUserFamilies() {
    return of([createFamily({ id: 1, name: 'Mendoza Family' })]);
  }

  getFamilies() {
    return of([
      createFamily({ id: 1, name: 'Mendoza Family' }),
      createFamily({ id: 2, name: 'Perez Family' }),
    ]);
  }

  getFamilyUsers() {
    return of([
      createFamilyUser({
        id: 1,
        family_id: 1,
        user_id: 1,
        family_role: 'parent',
        joined_at: '2026-05-01',
      }),
      createFamilyUser({
        id: 2,
        family_id: 1,
        user_id: 2,
        family_role: 'child',
        joined_at: '2026-05-01',
      }),
      createFamilyUser({
        id: 3,
        family_id: 2,
        user_id: 3,
        family_role: 'parent',
        joined_at: '2026-05-02',
      }),
    ]);
  }

  getFriends() {
    return of([
      createFriend({ id: 1, user_id: 1, friend_id: 2, status: 'accepted' }),
      createFriend({ id: 2, user_id: 2, friend_id: 1, status: 'accepted' }),
    ]);
  }

  getFamilyInvitations() {
    return of([
      createFamilyInvitation({
        id: 1,
        family_id: 1,
        inviter_user_id: 1,
        invited_user_id: 2,
        invited_role: 'child',
        status: 'accepted',
        created_at: '2026-05-01T10:00:00.000Z',
        responded_at: '2026-05-01T11:00:00.000Z',
      }),
    ]);
  }

  updateUser(user: User) {
    this.currentUserSignal.set(user);
    return of(user);
  }

  syncUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  removeFamilyMember() {
    return of(void 0);
  }

  createFriend(friend: Friend) {
    this.createFriendCalls.push(friend);
    return of(friend);
  }

  createFamilyInvitation(invitation: FamilyInvitation) {
    this.createFamilyInvitationCalls.push(invitation);
    return of(invitation);
  }
}

class MonetizationApiStub {
  getCosmetics() {
    return of([
      createCosmetic({
        id: 1,
        name: 'Eco Hat',
        description: 'Hat',
        price: 100,
        type: 'hat',
        imageUrl: '/assets/images/cosmetics/eco-hat.png',
      }),
    ]);
  }

  getUserCosmetics() {
    return of([
      createUserCosmetic({
        id: 1,
        userId: 1,
        cosmeticId: 1,
        acquiredAt: '2026-05-01',
        equipped: true,
      }),
    ]);
  }
}

class QuestsServiceStub {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly quests = signal([
    new Quest({
      id: 1,
      minigame_id: null,
      category: 'energy',
      title: 'Turn off unnecessary lights',
      description: 'Check the rooms at home and turn off any lights you are not using.',
      image_url: null,
      age: 0,
      type: 'activities',
      reward_gems: 20,
      reward_ecopoints: 25,
      expiration_date: null,
      time: 10,
    }),
  ]);
  readonly questsUser = signal([
    new QuestUser({
      id: 1,
      user_id: 1,
      quest_id: 1,
      status: 'completed',
      progress: 100,
      start_date: '2026-05-01',
      end_date: '2026-05-01',
      collaborative_session_id: null,
    }),
  ]);
  readonly activities = signal([
    new Activity({
      id: 1,
      quest_id: 1,
      description: 'Check the rooms',
      order: 1,
      type: 'checkbox',
      image_url: null,
    }),
  ]);
}

class CommunityServiceStub {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly communities = signal([
    createCommunity({
      id: 1,
      name: 'EcoMind Lima',
      user_count: 2,
      location: 'Lima, Peru',
    }),
  ]);
  readonly achievements = signal([
    createAchievement({
      id: 4,
      name: 'First step',
      description: 'Complete your first quest.',
      type: 'user',
    }),
  ]);
  readonly userAchievements = signal([
    createUserAchievement({
      id: 1,
      achievement_id: 4,
      user_id: 1,
      date: '2026-05-01',
    }),
  ]);
  readonly events = signal([
    createEvent({
      id: 1,
      community_id: 1,
      author_id: 1,
      name: 'Beach cleanup',
      description: 'We will meet at San Miguel beach to remove plastic and waste.',
      date: '2026-11-02',
      start_time: '2026-11-02T11:00:00',
      end_time: '2026-11-02T14:00:00',
      location: 'San Miguel Beach',
      latitude: -12,
      longitude: -77,
      capacity: 60,
      image_url: 'https://example.com/beach.png',
    }),
  ]);
  readonly posts = signal([
    createCommunityPost({
      id: 1,
      community_id: 1,
      user_id: 1,
      content: 'My family and I organized a cleanup.',
      points: 50,
      likes: 70,
      image_url: 'https://example.com/post.png',
      created_at: '2026-05-09T09:00:00',
    }),
  ]);
}

describe('ProfileContent', () => {
  let component: ProfileContent;
  let fixture: ComponentFixture<ProfileContent>;
  let profileService: ProfileServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileContent],
      providers: [
        { provide: ProfileService, useClass: ProfileServiceStub },
        { provide: QuestsService, useClass: QuestsServiceStub },
        { provide: CommunityService, useClass: CommunityServiceStub },
        { provide: MonetizationApi, useClass: MonetizationApiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileContent);
    component = fixture.componentInstance;
    profileService = TestBed.inject(ProfileService) as unknown as ProfileServiceStub;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('blocks family invitations when the target user already belongs to another family', () => {
    component.inviteFamilyMember({ userId: 3, role: 'child' });

    expect(profileService.createFamilyInvitationCalls).toHaveLength(0);
    expect(component.feedbackMessage()).toBe(
      'No se puede invitar al usuario porque ya tiene una familia asignada',
    );
  });

  it('creates a pending friend request for an eligible user', () => {
    component.sendFriendRequest(3);

    expect(profileService.createFriendCalls).toHaveLength(1);
    expect(profileService.createFriendCalls[0].user_id).toBe(1);
    expect(profileService.createFriendCalls[0].friend_id).toBe(3);
    expect(profileService.createFriendCalls[0].status).toBe('pending');
  });

  it('shows no pending quests when there are no missions in progress', () => {
    expect(component.pendingQuestProgress()).toEqual([]);
  });
});
