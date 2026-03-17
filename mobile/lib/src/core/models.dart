class UserSummary {
  const UserSummary({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  final String id;
  final String name;
  final String email;
  final String role;

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'student').toString(),
    );
  }
}

class StudentProfileModel {
  const StudentProfileModel({
    required this.userId,
    this.name,
    this.department,
    this.semester,
    this.skills = const [],
    this.resumeUrl,
    this.bio,
    this.cgpa,
    this.hoursRequired,
    this.linkedIn,
    this.github,
    this.profilePicture,
    this.bannerImage,
    this.phone,
    this.location,
  });

  final String userId;
  final String? name;
  final String? department;
  final int? semester;
  final List<String> skills;
  final String? resumeUrl;
  final String? bio;
  final num? cgpa;
  final num? hoursRequired;
  final String? linkedIn;
  final String? github;
  final String? profilePicture;
  final String? bannerImage;
  final String? phone;
  final String? location;

  factory StudentProfileModel.fromJson(Map<String, dynamic> json) {
    return StudentProfileModel(
      userId: (json['userId'] ?? '').toString(),
      name: json['name']?.toString(),
      department: json['department']?.toString(),
      semester: (json['semester'] as num?)?.toInt(),
      skills: ((json['skills'] as List?) ?? const []).map((e) => '$e').toList(),
      resumeUrl: json['resumeUrl']?.toString(),
      bio: json['bio']?.toString(),
      cgpa: json['cgpa'] as num?,
      hoursRequired: json['hoursRequired'] as num?,
      linkedIn: json['linkedIn']?.toString(),
      github: json['github']?.toString(),
      profilePicture: json['profilePicture']?.toString(),
      bannerImage: json['bannerImage']?.toString(),
      phone: json['phone']?.toString(),
      location: json['location']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'department': department,
      'semester': semester,
      'skills': skills,
      'resumeUrl': resumeUrl,
      'bio': bio,
      'cgpa': cgpa,
      'hoursRequired': hoursRequired,
      'linkedIn': linkedIn,
      'github': github,
      'profilePicture': profilePicture,
      'bannerImage': bannerImage,
      'phone': phone,
      'location': location,
    }..removeWhere((key, value) => value == null);
  }

  StudentProfileModel copyWith({
    String? name,
    String? department,
    int? semester,
    List<String>? skills,
    String? resumeUrl,
    String? bio,
    num? cgpa,
    num? hoursRequired,
    String? linkedIn,
    String? github,
    String? profilePicture,
    String? bannerImage,
    String? phone,
    String? location,
  }) {
    return StudentProfileModel(
      userId: userId,
      name: name ?? this.name,
      department: department ?? this.department,
      semester: semester ?? this.semester,
      skills: skills ?? this.skills,
      resumeUrl: resumeUrl ?? this.resumeUrl,
      bio: bio ?? this.bio,
      cgpa: cgpa ?? this.cgpa,
      hoursRequired: hoursRequired ?? this.hoursRequired,
      linkedIn: linkedIn ?? this.linkedIn,
      github: github ?? this.github,
      profilePicture: profilePicture ?? this.profilePicture,
      bannerImage: bannerImage ?? this.bannerImage,
      phone: phone ?? this.phone,
      location: location ?? this.location,
    );
  }
}

class CompanyModel {
  const CompanyModel({
    required this.id,
    required this.companyName,
    this.userId,
    this.logo,
    this.banner,
    this.website,
    this.description,
    this.location,
    this.industry,
    this.companySize,
    this.verified = false,
    this.founded,
    this.about,
    this.benefits,
    this.socialLinks = const {},
  });

  final String id;
  final String companyName;
  final String? userId;
  final String? logo;
  final String? banner;
  final String? website;
  final String? description;
  final String? location;
  final String? industry;
  final String? companySize;
  final bool verified;
  final String? founded;
  final String? about;
  final String? benefits;
  final Map<String, String> socialLinks;

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    final rawSocial = json['socialLinks'] as Map<String, dynamic>?;
    return CompanyModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      companyName: (json['companyName'] ?? '').toString(),
      userId: json['userId']?.toString(),
      logo: (json['logo'] ?? json['logoUrl'])?.toString(),
      banner: json['banner']?.toString(),
      website: json['website']?.toString(),
      description: (json['description'] ?? json['about'])?.toString(),
      location: json['location']?.toString(),
      industry: json['industry']?.toString(),
      companySize: json['companySize']?.toString(),
      verified: json['verified'] == true,
      founded: json['founded']?.toString(),
      about: json['about']?.toString(),
      benefits: json['benefits']?.toString(),
      socialLinks: rawSocial == null
          ? const {}
          : rawSocial.map((key, value) => MapEntry(key, '$value')),
    );
  }
}

class InternshipModel {
  const InternshipModel({
    required this.id,
    required this.title,
    required this.description,
    required this.company,
    this.skillsRequired = const [],
    this.durationWeeks = 0,
    this.stipend = 0,
    this.mode = 'remote',
    this.location,
    this.createdAt,
    this.updatedAt,
    this.contentUpdatedAt,
    this.matchScore,
    this.hasApplied = false,
    this.openings = 0,
    this.status = 'active',
    this.deadline,
    this.requirements,
    this.responsibilities,
    this.views = 0,
  });

  final String id;
  final String title;
  final String description;
  final CompanyModel company;
  final List<String> skillsRequired;
  final int durationWeeks;
  final int stipend;
  final String mode;
  final String? location;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? contentUpdatedAt;
  final int? matchScore;
  final bool hasApplied;
  final int openings;
  final String status;
  final DateTime? deadline;
  final String? requirements;
  final String? responsibilities;
  final int views;

  factory InternshipModel.fromJson(Map<String, dynamic> json) {
    return InternshipModel(
      id: (json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      company: CompanyModel.fromJson(
        (json['companyId'] as Map<String, dynamic>? ?? {}),
      ),
      skillsRequired: ((json['skillsRequired'] as List?) ?? const [])
          .map((e) => '$e')
          .toList(),
      durationWeeks: (json['durationWeeks'] as num?)?.toInt() ?? 0,
      stipend: (json['stipend'] as num?)?.toInt() ?? 0,
      mode: (json['mode'] ?? 'remote').toString(),
      location: json['location']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())?.toLocal()
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())?.toLocal()
          : null,
      contentUpdatedAt: json['contentUpdatedAt'] != null
          ? DateTime.tryParse(json['contentUpdatedAt'].toString())?.toLocal()
          : null,
      matchScore: (json['matchScore'] as num?)?.toInt(),
      hasApplied: json['hasApplied'] == true,
      openings: (json['openings'] as num?)?.toInt() ?? 0,
      status: (json['status'] ?? 'active').toString(),
      deadline: json['deadline'] != null
          ? DateTime.tryParse(json['deadline'].toString())?.toLocal()
          : null,
      requirements: json['requirements']?.toString(),
      responsibilities: json['responsibilities']?.toString(),
      views: (json['views'] as num?)?.toInt() ?? 0,
    );
  }
}

class ApplicationModel {
  const ApplicationModel({
    required this.id,
    required this.internshipId,
    required this.internshipTitle,
    required this.companyName,
    required this.status,
    this.companyUserId,
    this.logo,
    this.location,
    this.stipend,
    this.duration,
    this.notes,
    this.interviewDetails,
    this.appliedAt,
    this.lastUpdate,
  });

  final String id;
  final String internshipId;
  final String internshipTitle;
  final String companyName;
  final String status;
  final String? companyUserId;
  final String? logo;
  final String? location;
  final String? stipend;
  final String? duration;
  final String? notes;
  final Map<String, dynamic>? interviewDetails;
  final DateTime? appliedAt;
  final DateTime? lastUpdate;

  factory ApplicationModel.fromJson(Map<String, dynamic> json) {
    final internship = json['internshipId'] as Map<String, dynamic>? ?? {};
    final company = internship['companyId'] as Map<String, dynamic>? ?? {};
    return ApplicationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      internshipId: (internship['_id'] ?? '').toString(),
      internshipTitle: (internship['title'] ?? 'Unknown Internship').toString(),
      companyName: (company['companyName'] ?? 'Unknown Company').toString(),
      status: (json['status'] ?? 'pending').toString(),
      companyUserId: company['userId']?.toString(),
      logo: company['logo']?.toString(),
      location: internship['location']?.toString(),
      stipend: internship['stipend'] != null
          ? 'Rs ${internship['stipend']}/mo'
          : null,
      duration: internship['durationWeeks'] != null
          ? '${internship['durationWeeks']} weeks'
          : null,
      notes: json['notes']?.toString(),
      interviewDetails: json['interviewDetails'] as Map<String, dynamic>?,
      appliedAt: json['appliedAt'] != null
          ? DateTime.tryParse(json['appliedAt'].toString())?.toLocal()
          : null,
      lastUpdate: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())?.toLocal()
          : null,
    );
  }
}

class AppNotificationModel {
  const AppNotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    required this.createdAt,
    this.payload,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final bool read;
  final DateTime createdAt;
  final Map<String, dynamic>? payload;

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: (json['_id'] ?? '').toString(),
      type: (json['type'] ?? 'general').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      read: json['read'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '')
              ?.toLocal() ??
          DateTime.now(),
      payload: json['payload'] as Map<String, dynamic>?,
    );
  }
}

class ConversationModel {
  const ConversationModel({
    required this.applicationId,
    required this.otherPartyName,
    required this.internshipTitle,
    required this.unreadCount,
    this.lastMessage,
    this.applicationStatus,
    this.lastMessageAt,
    this.companyLogo,
    this.studentProfilePicture,
  });

  final String applicationId;
  final String otherPartyName;
  final String internshipTitle;
  final int unreadCount;
  final String? lastMessage;
  final String? applicationStatus;
  final DateTime? lastMessageAt;
  final String? companyLogo;
  final String? studentProfilePicture;

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final application = json['application'] as Map<String, dynamic>? ?? {};
    final internship =
        application['internshipId'] as Map<String, dynamic>? ?? {};
    final company = internship['companyId'] as Map<String, dynamic>? ?? {};
    final lastMessage = json['lastMessage'] as Map<String, dynamic>?;

    return ConversationModel(
      applicationId: (application['_id'] ?? '').toString(),
      otherPartyName: (company['companyName'] ?? 'Company').toString(),
      internshipTitle: (internship['title'] ?? 'Internship').toString(),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      lastMessage: lastMessage?['content']?.toString(),
      applicationStatus: application['status']?.toString(),
      lastMessageAt: lastMessage?['createdAt'] != null
          ? DateTime.tryParse(lastMessage!['createdAt'].toString())?.toLocal()
          : null,
      companyLogo: json['companyLogo']?.toString() ?? company['logo']?.toString(),
      studentProfilePicture: json['studentProfilePicture']?.toString(),
    );
  }
}

class ChatMessageModel {
  const ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.status,
    required this.createdAt,
    this.isDeleted = false,
    this.attachments = const [],
  });

  final String id;
  final String senderId;
  final String senderName;
  final String? content;
  final String status;
  final DateTime createdAt;
  final bool isDeleted;
  final List<Map<String, dynamic>> attachments;

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    final senderRaw = json['senderId'];
    final sender = senderRaw is Map<String, dynamic> ? senderRaw : <String, dynamic>{};
    final senderId = senderRaw is Map<String, dynamic>
        ? (senderRaw['_id'] ?? '').toString()
        : (senderRaw?.toString() ?? '');
    return ChatMessageModel(
      id: (json['_id'] ?? '').toString(),
      senderId: senderId,
      senderName: (sender['name'] ?? 'User').toString(),
      content: json['content']?.toString(),
      status: (json['status'] ?? 'sent').toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '')
              ?.toLocal() ??
          DateTime.now(),
      isDeleted: json['isDeleted'] == true,
      attachments: ((json['attachments'] as List?) ?? const [])
          .cast<Map<String, dynamic>>(),
    );
  }
}

class AnalyticsModel {
  const AnalyticsModel({
    required this.raw,
  });

  final Map<String, dynamic> raw;
}

class InboxCounts {
  const InboxCounts({
    required this.unreadMessages,
    required this.unreadNotifications,
  });

  final int unreadMessages;
  final int unreadNotifications;
}

class AppSession {
  const AppSession({
    required this.token,
    required this.user,
    required this.profile,
  });

  final String token;
  final UserSummary user;
  final StudentProfileModel? profile;
}
