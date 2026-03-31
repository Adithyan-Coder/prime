from rest_framework import serializers

class UserSerializer(serializers.Serializer):
    id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()
    role = serializers.ChoiceField(choices=['student', 'faculty', 'admin'])

class TeamMemberSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    contribution = serializers.CharField()

class ProjectSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    abstract = serializers.CharField()
    domains = serializers.ListField(child=serializers.CharField())
    year = serializers.CharField()
    license = serializers.CharField()
    techStack = serializers.ListField(child=serializers.CharField())
    status = serializers.ChoiceField(choices=['public', 'locked', 'approved'])
    owner = serializers.CharField()
    ownerId = serializers.CharField()
    teamMembers = TeamMemberSerializer(many=True)
    createdAt = serializers.DateTimeField()
    lastUpdated = serializers.DateTimeField()
    approvedFacultyIds = serializers.ListField(child=serializers.CharField(), required=False)
    approvalStatus = serializers.ChoiceField(choices=['pending', 'approved', 'rejected'], required=False)

class AccessRequestSerializer(serializers.Serializer):
    id = serializers.CharField()
    projectId = serializers.CharField()
    facultyId = serializers.CharField()
    facultyName = serializers.CharField()
    status = serializers.ChoiceField(choices=['pending', 'approved', 'rejected'])
    timestamp = serializers.DateTimeField()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class LandingContentSerializer(serializers.Serializer):
    title = serializers.CharField()
    subtitle = serializers.CharField()
    description = serializers.CharField()
    features = serializers.ListField(child=serializers.DictField())
