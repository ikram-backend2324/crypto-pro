from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analyzer', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='analysisresult',
            name='char_frequencies',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
