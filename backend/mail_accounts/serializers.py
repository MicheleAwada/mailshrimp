class DomainForeignKeyField(serializers.RelatedField):
    def to_representation(self, value):
        return value.id

    def to_internal_value(self, data):
        try:
            obj = models.Domain.objects.get(name=data)
            return obj
        except models.Domain.DoesNotExist:
            raise serializers.ValidationError("Related object does not exist.")

class MailBoxSerializer(serializers.ModelSerializer):
    domain = DomainForeignKeyField(queryset=models.Domain.objects.all())
    def validate(self, attrs):
        quota = attrs.get("quota")
        max_mailbox_quota = models.MailBox(domain=attrs.get("domain"), quota=attrs.get("quota"), ).get_max_mailbox_quota(exclude=False) # exclude=False since its not saved
        if quota > max_mailbox_quota:
            raise serializers.ValidationError("MailBox Quota must not be greater than Domain's Max MailBox Quota")
        return attrs
    def validate_password(self, value):
        fake_model = models.MailBox(password=value)
        fake_model.set_password(value)
        return fake_model.password

    class Meta:
        model = models.MailBox
        fields = ["fullname", "username", "quota", "password", "domain"]
        extra_kwargs = {
            "password": {"write_only": True},
        }